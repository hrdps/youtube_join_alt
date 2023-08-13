import jwt from 'jsonwebtoken';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import errorHandler from '../utils/errorHandler.js';
import { User } from '../models/user.js';

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new errorHandler('Not Logged in', 401));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded._id);
  next();
});
export const authorizedAdmin = catchAsyncError((req, res, next) => {
  if (req.user.role !== 'admin')
    return next(new errorHandler('User does not have authorized role', 403));
  next();
});

export const authorizedSubscriber = catchAsyncError((req, res, next) => {
  if (req.user.role !== 'admin' && req.user.subscription.status !== 'active')
    return next(
      new errorHandler('Subscription is required for the access', 403)
    );
  next();
});
