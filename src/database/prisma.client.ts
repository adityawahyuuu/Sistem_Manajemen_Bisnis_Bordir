import dotenv from 'dotenv';
import path from 'path';

// Resolve .env from project root (works regardless of cwd)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../prisma/generated/prisma';
import { logger } from '../shared/utils/logger.util';

// Log database configuration (without password)
logger.info(`Database config: host=${process.env.DATABASE_HOST}, port=${process.env.DATABASE_PORT}, user=${process.env.DATABASE_USER}, db=${process.env.DATABASE_NAME}`);

// MariaDB adapter configuration (MySQL 8 compatible)
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
  connectTimeout: 10000,
  acquireTimeout: 10000,
});

// Single PrismaClient instance for the entire application
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected gracefully');
  } catch (error) {
    logger.error('Error during database disconnect:', error);
  }
};

process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});
