import { Course } from '../models/course.js';
import catchAsycError from '../middlewares/catchAsyncError.js';
import errorHandler from '../utils/errorHandler.js';
import getDataUri from '../utils/dataUri.js';
import cloudinary from 'cloudinary';
import { Stats } from '../models/stats.js';

export const getCourses = catchAsycError(async (req, res, next) => {
  const keyword = req.query.keyword || '';
  const category = req.query.category || '';
  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: 'i',
    },
    category: {
      $regex: category,
      $options: 'i',
    },
  }).select('-lectures');
  res.status(200).json({
    count: courses.length,
    status: 200,
    courses,
  });
});

export const createCourse = catchAsycError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new errorHandler('Please enter the blank fields', 400));
  }
  const file = req.file;
  if (!file)
    return next(
      new errorHandler('Please select the file you want to add.', 400)
    );
  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  await Course.create({
    title: title,
    description: description,
    category: category,
    createdBy: createdBy,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: 'Course created successfully!',
  });
});

export const getCourseLecture = catchAsycError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new errorHandler('Course not found', 404));
  course.views += 1;
  course.save();

  res.status(200).json({
    count: course.lectures.length,
    success: true,
    lectures: course.lectures,
  });
});

export const addCourseLecture = catchAsycError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new errorHandler('Course not found', 404));
  const { title, description } = req.body;
  if (!title || !description) {
    return next(new errorHandler('Please enter the blank fields', 400));
  }
  const file = req.file;
  if (!file)
    return next(
      new errorHandler('Please select the file you want to add.', 400)
    );
  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: 'video',
  });

  course.lectures.push({
    title: title,
    description: description,
    video: { public_id: mycloud.public_id, url: mycloud.secure_url },
  });
  course.numOfVideos = course.lectures.length;
  course.save();

  res
    .status(200)
    .json({
      count: course.lectures.length,
      success: true,
      lectures: course.lectures,
    });
});

export const deleteCourse = catchAsycError(async (req, res, next) => {
  const id = req.params.id;
  const course = await Course.findById(id);
  if (!course) return next(new errorHandler('Course not found', 404));

  await cloudinary.v2.uploader.destroy(course.poster.public_id, {
    resource_type: 'image',
  });

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: 'video',
    });
  }
  await course.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully!',
  });
});

export const deleteLecture = catchAsycError(async (req, res, next) => {
  const { courseID, lectureID } = req.query;
  const course = await Course.findById(courseID);
  if (!course) return next(new errorHandler('Course not found', 404));

  const lecture = course.lectures.filter((item) => {
    if (item._id.toString() === lectureID.toString()) return item;
  });
  if (!lecture) return next(new errorHandler('Lecture not found', 404));

  await cloudinary.v2.uploader.destroy(lecture[0].video.public_id, {
    resource_type: 'video',
  });
  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureID.toString()) return item;
  });
  course.numOfVideos = course.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: 'Lecture deleted successfully!',
  });
});

Course.watch().on('change', async () => {
  const stats = await Stats.find({}).sort({ createdAt: 'desc' }).limit(1);
  let totalCount = 0;
  const courses = await Course.find();
  for (let i = 0; i < courses.length; i++) {
    totalCount += courses[i].views;
  }
  stats[0].views = totalCount;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
