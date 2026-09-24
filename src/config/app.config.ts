import dotenv from 'dotenv';
import path from 'path';

// Resolve .env from project root (works regardless of cwd)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Production port is fixed and must not drift between deploys, regardless of
// what PORT is set to in the environment. Development reads PORT from .env
// so a dev can run on a free port locally.
const PRODUCTION_PORT = 5090;

export const appConfig = {
  env: nodeEnv,
  port: isProduction ? PRODUCTION_PORT : parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/patchwork/api',
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
