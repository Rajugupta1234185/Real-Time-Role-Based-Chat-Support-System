import mongoose from "mongoose";
import dotenv from 'dotenv';

// ✅ Fix 1: Correct path to `.env` (you're already in backend folder, so no need for path unless `.env` is outside)
dotenv.config();
console.log("MONGOURI:", process.env.MONGOURI);

 // or use { path: '../.env' } if needed

// ✅ Fix 2: Use async/await for proper error handling and cleaner syntax
const dbconnect = async () => {
  try {
    await mongoose.connect(process.env.MONGOURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error connecting to database:", error.message);
    process.exit(1);  // Optional: Exit app on DB failure
  }
};

export default dbconnect;
