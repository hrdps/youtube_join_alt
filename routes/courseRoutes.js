import express from 'express';
import {
  getCourses,
  createCourse,
  getCourseLecture,
  addCourseLecture,
  deleteCourse,
  deleteLecture,
} from '../controllers/courseController.js';
const router = express.Router();
import singleUpload from '../middlewares/multer.js';
import {
  authorizedAdmin,
  authorizedSubscriber,
  isAuthenticated,
} from '../middlewares/auth.js';

router.route('/courses').get(isAuthenticated, authorizedAdmin, getCourses);
router
  .route('/createcourse')
  .post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);
router
  .route('/course/:id')
  .get(isAuthenticated, authorizedSubscriber, getCourseLecture)
  .post(isAuthenticated, authorizedAdmin, singleUpload, addCourseLecture)
  .delete(isAuthenticated, authorizedAdmin, deleteCourse);

router
  .route('/deletelecture')
  .delete(isAuthenticated, authorizedAdmin, deleteLecture);
export default router;
