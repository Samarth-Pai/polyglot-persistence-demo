import mongoose from 'mongoose';

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected successfully at ${uri}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

export async function disconnectMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
}

export default mongoose;
