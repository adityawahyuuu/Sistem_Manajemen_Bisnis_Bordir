import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
};

export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  apiKey: process.env.FIREBASE_API_KEY || '',
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
};

export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  path: process.env.LOG_PATH || './logs',
};
