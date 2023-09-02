import catchAsyncError from '../middlewares/catchAsyncError.js';
import { User } from '../models/user.js';
import errorHandler from '../utils/errorHandler.js';
import { instance } from '../server.js';
import crypto from 'crypto';
import { Payment } from '../models/payment.js';

export const subscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.role === 'admin')
    return next(new errorHandler('Admin cannot subscribe!', 400));
  const plan_id = process.env.PLAN_ID || 'plan_MO4Quv0wmHMt6V';
  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();
  res.status(200).json({
    success: true,
    subscription,
  });
});

export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user);
  const subscription_id = user.subscription.id;
  const generated_signature = crypto
    .createHmac('sha256', process.env.PAYMENT_GATEWAY_SECRET)
    .update(razorpay_payment_id + '|' + subscription_id, 'utf-8')
    .digest('hex');

  const isAuthentic = generated_signature === razorpay_signature;
  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });
  user.subscription.status = 'active';
  await user.save();
  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorpayKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.PAYMENT_GATEWAY_KEY,
  });
});

export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscription_id = user.subscription.id;
  let refund = false;

  await instance.subscriptions.cancel(subscription_id);
  const payment = Payment.findOne({
    razorpay_subscription_id: subscription_id,
  });
  if (!payment)
    return next(
      new errorHandler('There is some trouble feching payment info!', 400)
    );
  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_TIME * 24 * 60 * 60 * 1000;
  if (refundTime > gap) {
    refund = true;
    await instance.payments.refund(payment.razorpay_payment_id);
  }
  await payment.deleteOne();

  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: refund
      ? 'Subcription has been cancelled and your refund will be completed within 7 days'
      : 'Subcription has been cancelled and you are not eligible for a refund',
  });
});
