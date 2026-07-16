const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFilesToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryStorage');

const uploadsDir = path.join(__dirname, '../uploads');

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed (jpg, png, webp, gif, mp4, webm, mov)'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});

// @desc    Upload one or more media files to Cloudinary
// @route   POST /api/catalog/upload
// @access  Private/Admin
const uploadImages = [
    upload.array('images', 10),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const assets = await uploadFilesToCloudinary(req.files, {
                folder: 'woodentoy/catalog',
            });
            const urls = assets.map((asset) => asset.secure_url);

            res.status(201).json({
                success: true,
                message: `${assets.length} file(s) uploaded to Cloudinary successfully`,
                data: { urls, assets },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];

// @desc    Delete Cloudinary media by publicId, or legacy local media by filename
// @route   DELETE /api/catalog/upload/:filename
// @access  Private/Admin
const deleteImage = async (req, res) => {
    try {
        const publicId = req.body?.publicId || req.query?.publicId;
        if (publicId) {
            const result = await deleteFromCloudinary(
                publicId,
                req.body?.resourceType || req.query?.resourceType || 'image'
            );
            return res.json({ success: true, message: 'Cloudinary asset deleted', data: result });
        }

        const filename = req.params.filename;
        if (!/^[\w\-. ]+$/.test(filename)) {
            return res.status(400).json({ success: false, message: 'Invalid filename' });
        }

        const filePath = path.join(uploadsDir, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'Legacy local image deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadImages, deleteImage };
