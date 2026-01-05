import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/home_services_crm';
  if (!uri) {
    throw new Error('MONGODB_URI not set');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  console.log('Connected to MongoDB');
}
