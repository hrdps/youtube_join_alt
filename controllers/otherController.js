import catchAsncError from '../middlewares/catchAsyncError.js';
import errorHandler from '../utils/errorHandler.js';
import { sendMail } from '../utils/sendMail.js';
import { Stats } from '../models/stats.js';

export const contact = catchAsncError(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return next(new errorHandler('Please enter the blank fields', 400));
  const to = process.env.MY_MAIL;
  const subject = 'New Contact Submission! - CourseClump';
  const text = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
  await sendMail(to, subject, text);

  res.status(200).json({
    success: true,
    message: 'Contact form submitted successfully',
  });
});

export const requestCourse = catchAsncError(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course)
    return next(new errorHandler('Please enter the blank fields', 400));
  const to = process.env.MY_MAIL;
  const subject = 'New Course Request! - CourseClump';
  const text = `Name: ${name}\nEmail: ${email}\nCourse: ${course}`;
  await sendMail(to, subject, text);

  res.status(200).json({
    success: true,
    message: 'New course request submitted successfully',
  });
});

export const dashboardStats = catchAsncError(async (req, res, next) => {
  const stats = await Stats.find({}).sort({ createdAt: 'desc' }).limit(12);

  const statsList = [];
  for (let i = 0; i < stats.length; i++) {
    statsList.unshift(stats[i]);
  }
  const remainingSize = 12 - stats.length;
  for (let i = 0; i < remainingSize; i++) {
    statsList.unshift({ users: 0, subscribers: 0, views: 0 });
  }
  let usersProfit = true,
    subscribersProfit = true,
    viewsProfit = true;

  let usersPercentage =
    ((statsList[11].users - statsList[10].users) / statsList[10].users) * 100;
  let subscribersPercentage =
    ((statsList[11].subscribers - statsList[10].subscribers) /
      statsList[10].subscribers) *
    100;
  let viewsPercentage =
    ((statsList[11].views - statsList[10].views) / statsList[10].views) * 100;
  if (usersPercentage < 0) usersProfit = false;
  if (subscribersPercentage < 0) subscribersProfit = false;
  if (viewsPercentage < 0) viewsProfit = false;
  usersPercentage = Math.round(usersPercentage * 10) / 10;
  subscribersPercentage = Math.round(subscribersPercentage * 10) / 10;
  viewsPercentage = Math.round(viewsPercentage * 10) / 10;
  res.status(200).json({
    success: true,
    stats: statsList,
    usersCount: statsList[11].users,
    subscribersCount: statsList[11].subscribers,
    viewsCount: statsList[11].views,
    usersPercentage,
    subscribersPercentage,
    viewsPercentage,
    usersProfit,
    subscribersProfit,
    viewsProfit,
  });
});
