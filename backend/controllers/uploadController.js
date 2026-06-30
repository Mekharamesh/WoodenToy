const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${ext}`);
    },
});

// File filter — only images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, webp, gif)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// @desc    Upload one or more product images
// @route   POST /api/catalog/upload
// @access  Private/Admin
const uploadImages = [
    upload.array('images', 10), // max 10 images
    (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No images uploaded' });
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const urls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

            res.status(201).json({
                success: true,
                message: `${req.files.length} image(s) uploaded successfully`,
                data: { urls },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];

// @desc    Delete an uploaded image by filename
// @route   DELETE /api/catalog/upload/:filename
// @access  Private/Admin
const deleteImage = (req, res) => {
    try {
        const filename = req.params.filename;
        // Sanitize: only allow simple filenames (no path traversal)
        if (!/^[\w\-. ]+$/.test(filename)) {
            return res.status(400).json({ success: false, message: 'Invalid filename' });
        }

        const filePath = path.join(uploadsDir, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadImages, deleteImage };
