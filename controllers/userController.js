import { User } from '../models/user.js';
import { Course } from '../models/course.js';
import catchAsycError from '../middlewares/catchAsyncError.js';
import errorHandler from '../utils/errorHandler.js';
import { sendToken } from '../utils/sendToken.js';
import { sendMail } from '../utils/sendMail.js';
import crypto from 'crypto';
import getDataUri from '../utils/dataUri.js';
import cloudinary from 'cloudinary';
import { Stats } from '../models/stats.js';
import { stat } from 'fs';
import { instance } from '../server.js';
import { Payment } from '../models/payment.js';

export const register = catchAsycError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new errorHandler('Please enter the blank fields', 400));
  }
  let user = await User.findOne({ email: email });
  if (user) {
    return next(
      new errorHandler('Entered email address is already in use', 409)
    );
  }
  const file = req.file;
  if (!file)
    return next(
      new errorHandler('Please select the file you want to add.', 400)
    );
  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name: name,
    email: email,
    password: password,
    avatar: { public_id: mycloud.public_id, url: mycloud.secure_url },
  });
  sendToken(res, user, 'User Created Successfully', 201);
});

export const login = catchAsycError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new errorHandler('Please enter the blank fields', 400));
  }
  const user = await User.findOne({ email: email }).select('+password');

  if (!user) {
    return next(new errorHandler('Incorrect Email or Password', 409));
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new errorHandler('Incorrect Email or Password', 409));
  }
  sendToken(res, user, `Welcome ${user.name}`, 201);
});

export const logout = catchAsycError(async (req, res, next) => {
  res
    .status(200)
    .cookie('token', null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: 'Logged out Successfully!',
    });
});

export const getMyProfile = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.user);
  res.status(200).json({
    success: true,
    user,
  });
});

export const updatePassword = catchAsycError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(new errorHandler('Please enter the blank fields', 400));
  const user = await User.findById(req.user).select('+password');
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) return next(new errorHandler('Incorrect Old Password', 409));

  user.password = newPassword;

  await user.save();

  res
    .status(200)
    .json({ success: true, message: 'Password changed succesfully' });
});

export const updateProfile = catchAsycError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user);
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();
  res
    .status(200)
    .json({ success: true, message: 'Profile updated succesfully' });
});

export const updateProfilePicture = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.user);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id, {
    resource_type: 'image',
  });

  const file = req.file;
  if (!file)
    return next(
      new errorHandler('Please select the file you want to add.', 400)
    );
  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  user.avatar.public_id = mycloud.public_id;
  user.avatar.url = mycloud.secure_url;
  await user.save();
  res
    .status(200)
    .json({ success: true, message: 'Profile Picture updated succesfully' });
});

export const forgetpassword = catchAsycError(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new errorHandler('Please enter a valid email address', 400));
  const user = await User.findOne({ email: email });
  if (!user) return next(new errorHandler('User not found', 400));
  const resetToken = await user.getResetToken();
  await user.save();
  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  const message = `Hi ${user.name},\n\nA password reset for your account was requested. Please click the button below to change your password.\n\nNote that this link is valid for 15 minutes. After the time limit has expired, you will have to resubmit the request for a password reset.\n\n<a href='${url}'>Reset Link</a>\n\nIf you did not make this request, please ignore.`;

  await sendMail(user.email, 'CourseClump Reset Password Link', message);
  res.status(200).json({
    success: true,
    message: 'Reset Password link has been sent on the registered email',
  });
});

export const resetPassword = catchAsycError(async (req, res, next) => {
  const { password, repassword } = req.body;
  if (!password || !repassword)
    return next(new errorHandler('Please check the blank fields', 400));
  if (password !== repassword)
    return next(new errorHandler('Password did not match', 400));
  const { token } = req.params;
  if (!token) return next(new errorHandler('Invalid URL', 400));
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');
  if (!user)
    return next(
      new errorHandler('Either token is invalid or has been expired', 400)
    );
  user.password = password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res
    .status(200)
    .json({ success: true, message: 'Password Changed Successfully!' });
});

export const addToPlaylist = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.user);
  const course = await Course.findById(req.body.id);
  if (!course) return next(new errorHandler('Invalid Course ID', 404));
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });

  if (itemExist) return next(new errorHandler('Course already added', 409));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();
  res
    .status(200)
    .json({ success: true, message: 'Course added to the playlist!' });
});

export const removeFromPlaylist = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.user);
  const courseID = req.query.id;
  if (!courseID) return next(new errorHandler('Invalid URL', 404));
  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== courseID) return item;
  });
  user.playlist = newPlaylist;
  await user.save();
  res.status(200).json({
    success: true,
    message: 'Course has been deleted from the playlist!',
  });
});

export const getAllUsers = catchAsycError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    count: users.length,
    success: true,
    users,
  });
});

export const updateUserRole = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new errorHandler('User not found', 404));
  if (user.role === 'user') user.role = 'admin';
  else user.role = 'user';
  await user.save();
  res.status(200).json({
    success: true,
    message: `${user.name} has been updated to ${user.role}`,
  });
});

export const deleteUser = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new errorHandler('User not found', 404));
  if (
    user.subscription !== undefined &&
    user.subscription.status === 'active'
  ) {
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
  }
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: `User has been deleted!`,
  });
});

export const deleteMyProfile = catchAsycError(async (req, res, next) => {
  const user = await User.findById(req.user);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();
  res
    .status(200)
    .cookie('token', null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: `User has been deleted!`,
    });
});

User.watch().on('change', async () => {
  const stats = await Stats.find({}).sort({ createdAt: 'desc' }).limit(1);
  const userCount = await User.countDocuments();
  const subs = await User.find({ 'subscription.status': 'active' });
  const subsCount = subs.length;
  stats[0].users = userCount;
  stats[0].subscribers = subsCount;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
