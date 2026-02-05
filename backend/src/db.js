
import mongoose from 'mongoose';
const connectDB = async () => {
  try {
    // Force IPv4 to avoid potential DNS issues with querySrv
    const conn = await mongoose.connect(process.env.MONGO_DB_URL, {
      family: 4,
    });
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
