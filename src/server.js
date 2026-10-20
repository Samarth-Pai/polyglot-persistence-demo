import 'dotenv/config';
import app from './app.js';
import { connectPrisma, disconnectPrisma } from './config/prisma.js';
import { connectMongoDB, disconnectMongoDB } from './config/mongoose.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('🚀 Initializing Polyglot Persistence Backend Services...');

  // Initialize all three database connections
  try {
    await connectPrisma();
  } catch (error) {
    console.warn('⚠️  PostgreSQL connection warning:', error.message);
  }

  try {
    await connectMongoDB();
  } catch (error) {
    console.warn('⚠️  MongoDB connection warning:', error.message);
  }

  try {
    await connectRedis();
  } catch (error) {
    console.warn('⚠️  Redis connection warning:', error.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`🩺 Health check:    http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });

  // Graceful shutdown handling
  async function shutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await Promise.allSettled([
        disconnectPrisma(),
        disconnectMongoDB(),
        disconnectRedis(),
      ]);
      console.log('All database connections closed. Process terminating.');
      process.exit(0);
    });

    // Force shutdown after timeout if hanging
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
