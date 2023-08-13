import app from './app.js';
import { connectDB } from './config/database.js';
connectDB();
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay';
import nodeCron from 'node-cron';
import { Stats } from './models/stats.js';

nodeCron.schedule('0 0 0 1 * *', async () => {
  await Stats.create({});
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const instance = new Razorpay({
  key_id: process.env.PAYMENT_GATEWAY_KEY,
  key_secret: process.env.PAYMENT_GATEWAY_SECRET,
});

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
