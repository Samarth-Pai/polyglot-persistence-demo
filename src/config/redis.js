import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('connect', () => {
  console.log('🔗 Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis connected successfully and ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('🔌 Redis client disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Redis:', error.message);
    }
  }
}

export default redisClient;
