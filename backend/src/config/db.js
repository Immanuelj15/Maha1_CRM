import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let dbMode = 'local'; // 'mongodb' | 'local'

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/catermaster';
  
  if (process.env.DB_MODE === 'local') {
    console.log('⚠️ Forced Local JSON Fallback Mode via Environment variable.');
    dbMode = 'local';
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    // Timeout quickly (3 seconds) so the app startup doesn't hang if Mongo isn't running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✨ Connected successfully to MongoDB at:', mongoUri);
    dbMode = 'mongodb';
  } catch (error) {
    console.warn('⚠️ Could not connect to MongoDB:', error.message);
    console.warn('🚀 Falling back to Local JSON-File Database Engine (zero-dependency mode).');
    dbMode = 'local';
  }
};
