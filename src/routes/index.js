import { Router } from 'express';
import userRoutes from './user.routes.js';
import menuRoutes from './menu.routes.js';
import driverRoutes from './driver.routes.js';
import prisma from '../config/prisma.js';
import mongoose from '../config/mongoose.js';
import redisClient from '../config/redis.js';

const router = Router();

// Health & System Overview Endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    databases: {
      postgres: 'disconnected',
      mongodb: 'disconnected',
      redis: 'disconnected',
    },
  };

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.databases.postgres = 'connected';
  } catch {
    health.databases.postgres = 'error';
  }

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      health.databases.mongodb = 'connected';
    } else {
      health.databases.mongodb = 'disconnected';
    }
  } catch {
    health.databases.mongodb = 'error';
  }

  // Check Redis
  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      health.databases.redis = 'connected';
    } else {
      health.databases.redis = 'disconnected';
    }
  } catch {
    health.databases.redis = 'error';
  }

  const allConnected = Object.values(health.databases).every((s) => s === 'connected');
  return res.status(allConnected ? 200 : 207).json(health);
});

// Polyglot persistence routes
router.use('/users', userRoutes);
router.use('/menu', menuRoutes);
router.use('/driver', driverRoutes);

export default router;
