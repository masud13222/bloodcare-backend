const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { AppError } = require('./errorHandler');

// Configure Cloudinary (only if credentials are provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Create uploads directory if it doesn't exist
const createUploadDirs = () => {
  const dirs = [
    'assets',
    'assets/profileimage',
    'assets/documents',
    'assets/certificates'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'assets/';
    
    if (file.fieldname === 'avatar' || file.fieldname === 'profileImage') {
      uploadPath = 'assets/profileimage/';
    } else if (file.fieldname === 'document') {
      uploadPath = 'assets/documents/';
    } else if (file.fieldname === 'certificate') {
      uploadPath = 'assets/certificates/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = file.fieldname;
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// Cloudinary storage configuration (only if credentials are available)
let cloudinaryStorage = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      let folder = 'bloodcare/misc';
      
      if (file.fieldname === 'avatar' || file.fieldname === 'profileImage') {
        folder = 'bloodcare/profileimages';
      } else if (file.fieldname === 'document') {
        folder = 'bloodcare/documents';
      } else if (file.fieldname === 'certificate') {
        folder = 'bloodcare/certificates';
      }
      
      return {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        public_id: `${file.fieldname}-${Date.now()}`,
      };
    }
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type based on field name
  if (file.fieldname === 'avatar' || file.fieldname === 'profileImage') {
    // Only images for profile
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed for profile pictures', 400), false);
    }
  } else if (file.fieldname === 'document' || file.fieldname === 'certificate') {
    // Images and documents for other uploads
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only images, PDF, and Word documents are allowed', 400), false);
    }
  } else {
    cb(new AppError('Unknown field name', 400), false);
  }
};

// Get storage based on configuration
const getStorage = () => {
  const uploadStrategy = process.env.UPLOAD_STRATEGY || 'local'; // local, cloudinary, both
  
  switch (uploadStrategy) {
    case 'cloudinary':
      return cloudinaryStorage || localStorage; // Fallback to local if cloudinary not configured
    case 'local':
    default:
      return localStorage;
  }
};

// Create multer instance
const upload = multer({
  storage: getStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// Upload to both local and cloudinary
const uploadToBoth = async (file, req) => {
  const results = {};
  
  try {
    // Upload to local storage
    if (process.env.SAVE_LOCAL === 'true') {
      const localPath = `assets/profileimage/${file.filename}`;
      results.local = {
        filename: file.filename,
        path: localPath,
        url: `${req.protocol}://${req.get('host')}/${localPath}`
      };
    }
    
    // Upload to Cloudinary
    if (process.env.SAVE_CLOUDINARY === 'true') {
      const cloudinaryResult = await cloudinary.uploader.upload(file.path || file.buffer, {
        folder: 'bloodcare/profileimages',
        public_id: `profile-${Date.now()}`,
        resource_type: 'auto'
      });
      
      results.cloudinary = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        format: cloudinaryResult.format
      };
    }
    
    return results;
  } catch (error) {
    throw new AppError(`Upload failed: ${error.message}`, 500);
  }
};

// Middleware for handling dual upload
const dualUploadMiddleware = (fieldName) => {
  return async (req, res, next) => {
    const uploadStrategy = process.env.UPLOAD_STRATEGY || 'local';
    
    if (uploadStrategy === 'both') {
      // Handle dual upload
      const singleUpload = upload.single(fieldName);
      
      singleUpload(req, res, async (err) => {
        if (err) {
          return next(err);
        }
        
        if (req.file) {
          try {
            const uploadResults = await uploadToBoth(req.file, req);
            req.uploadResults = uploadResults;
          } catch (error) {
            return next(error);
          }
        }
        
        next();
      });
    } else {
      // Single upload strategy
      const singleUpload = upload.single(fieldName);
      singleUpload(req, res, next);
    }
  };
};

// Delete file from storage
const deleteFile = async (fileInfo) => {
  try {
    // Delete from local storage
    if (fileInfo.local && fileInfo.local.path) {
      if (fs.existsSync(fileInfo.local.path)) {
        fs.unlinkSync(fileInfo.local.path);
      }
    }
    
    // Delete from Cloudinary
    if (fileInfo.cloudinary && fileInfo.cloudinary.public_id) {
      await cloudinary.uploader.destroy(fileInfo.cloudinary.public_id);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Get file URL based on priority
const getFileUrl = (fileInfo) => {
  const priority = process.env.FILE_URL_PRIORITY || 'cloudinary'; // cloudinary, local
  
  if (priority === 'cloudinary' && fileInfo.cloudinary) {
    return fileInfo.cloudinary.url;
  } else if (priority === 'local' && fileInfo.local) {
    return fileInfo.local.url;
  } else {
    // Fallback to available option
    return fileInfo.cloudinary?.url || fileInfo.local?.url || null;
  }
};

// Serve static files
const serveStaticFiles = (app) => {
  const express = require('express');
  app.use('/assets', express.static('assets'));
};

module.exports = {
  upload,
  dualUploadMiddleware,
  deleteFile,
  getFileUrl,
  serveStaticFiles,
  cloudinary
};