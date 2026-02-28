// Re-export from single prisma client instance
// All modules should use the same PrismaClient to avoid multiple connection pools
export { prisma } from '../database/prisma.client';
