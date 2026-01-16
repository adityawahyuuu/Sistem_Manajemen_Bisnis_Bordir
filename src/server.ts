import app from './app';
import { appConfig } from './config';
import { prisma } from './database/prisma.client';
import { logger } from './shared/utils/logger.util';
import fs from 'fs';
import path from 'path';

// Ensure required directories exist
const dirs = ['logs', 'storage/templates', 'storage/generated', 'storage/whatsapp'];
dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    app.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port}`);
      logger.info(`Environment: ${appConfig.env}`);
      logger.info(`API Prefix: ${appConfig.apiPrefix}`);
    });

    logger.info('Database connection test completed');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
