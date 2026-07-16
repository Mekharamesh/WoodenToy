const { Readable } = require('stream');
const { v2: cloudinary } = require('cloudinary');

const assertConfigured = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const getResourceType = (file = {}) => {
  if (file.mimetype?.startsWith('video/')) return 'video';
  if (file.mimetype?.startsWith('image/')) return 'image';
  return 'auto';
};

const uploadBufferToCloudinary = (file, { folder = 'woodentoy/uploads' } = {}) => {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: getResourceType(file),
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          original_filename: file.originalname,
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const uploadFilesToCloudinary = async (files = [], options = {}) => {
  const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  return Promise.all(safeFiles.map((file) => uploadBufferToCloudinary(file, options)));
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  assertConfigured();
  if (!publicId) {
    throw new Error('Cloudinary public ID is required.');
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  uploadFilesToCloudinary,
  deleteFromCloudinary,
};
