import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { storageConfig, uploadConfig } from '../../config/app.config';
import { AppError } from '../../middleware';

// Ensure directories exist
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize directories
ensureDir(storageConfig.companyLogosPath);
ensureDir(storageConfig.templatePhotosPath);

// File filter for images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError(`Invalid file type. Allowed types: ${uploadConfig.allowedMimeTypes.join(', ')}`, 400));
  }

  if (!uploadConfig.allowedExtensions.includes(ext)) {
    return cb(new AppError(`Invalid file extension. Allowed extensions: ${uploadConfig.allowedExtensions.join(', ')}`, 400));
  }

  cb(null, true);
};

// Storage for company logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(storageConfig.companyLogosPath);
    cb(null, storageConfig.companyLogosPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `logo-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Storage for template photos
const templatePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(storageConfig.templatePhotosPath);
    cb(null, storageConfig.templatePhotosPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `photo-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Multer instances
export const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: uploadConfig.maxFileSize,
  },
  fileFilter: imageFileFilter,
});

export const uploadTemplatePhoto = multer({
  storage: templatePhotoStorage,
  limits: {
    fileSize: uploadConfig.maxFileSize,
  },
  fileFilter: imageFileFilter,
});

// Delete file utility
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      resolve();
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Get public URL for file
export const getFileUrl = (filename: string, type: 'logo' | 'template-photo'): string => {
  const basePath = type === 'logo' ? 'logos' : 'template-photos';
  return `/uploads/${basePath}/${filename}`;
};
