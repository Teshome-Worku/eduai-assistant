const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries}/${maxRetries} failed: ${error.message}`);
      if (retries < maxRetries) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise(res => setTimeout(res, 5000));
      } else {
        console.error('All MongoDB connection attempts failed. Server will run but database features will not work.');
      }
    }
  }
};

module.exports = connectDB;
