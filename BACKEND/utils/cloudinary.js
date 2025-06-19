import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const validateCloudinaryConfig = () => {
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required Cloudinary environment variables: ${missing.join(', ')}`);
    }
};

// Only validate if we're not in test environment
if (process.env.NODE_ENV !== 'test') {
    validateCloudinaryConfig();
}

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: 'event_thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 900, height: 506, crop: 'fill', gravity: 'auto' }]
    },
});

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const deleteCloudinaryImage = async (publicId) => {
    try {
        if (!publicId) return;
        await cloudinary.v2.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            message: 'File upload error',
            error: error.message
        });
    }
    next(error);
};
