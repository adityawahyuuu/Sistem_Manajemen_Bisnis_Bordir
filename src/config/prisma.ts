import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { logger } from '../shared/utils/logger.util';

// MariaDB adapter configuration with better pool settings
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
  acquireTimeout: 30000 // 30 seconds
});

// Initialize Prisma Client with logging
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// Test database connection on startup (with proper cleanup)
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    // Immediately disconnect after test - Prisma will auto-reconnect on first query
    await prisma.$disconnect();
    logger.info('Database connection test completed');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Run connection test
testDatabaseConnection();

// Graceful shutdown - disconnect when application exits
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

process.on('beforeExit', gracefulShutdown);

export { prisma }