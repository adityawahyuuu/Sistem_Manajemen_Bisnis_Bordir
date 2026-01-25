import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
};

export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

export const storageConfig = {
  basePath: process.env.STORAGE_PATH || './storage',
  templatesPath: process.env.TEMPLATES_PATH || './storage/templates',
  generatedPath: process.env.GENERATED_PATH || './storage/generated',
  whatsappPath: process.env.WHATSAPP_PATH || './storage/whatsapp',
  uploadsPath: process.env.UPLOADS_PATH || './storage/uploads',
  companyLogosPath: process.env.COMPANY_LOGOS_PATH || './storage/uploads/logos',
  templatePhotosPath: process.env.TEMPLATE_PHOTOS_PATH || './storage/uploads/template-photos',
};

export const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  path: process.env.LOG_PATH || './logs',
};
