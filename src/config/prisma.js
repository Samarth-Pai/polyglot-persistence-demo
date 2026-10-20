import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully via Prisma');
  } catch (error) {
    console.error('❌ PostgreSQL connection error via Prisma:', error.message);
    throw error;
  }
}

export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('🔌 PostgreSQL disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting PostgreSQL:', error.message);
  }
}

export default prisma;
