import express from 'express';
const router = express.Router();
import { authorizedAdmin, isAuthenticated } from '../middlewares/auth.js';
import {
  contact,
  dashboardStats,
  requestCourse,
} from '../controllers/otherController.js';

router.route('/contact').post(contact);
router.route('/requestcourse').post(requestCourse);
router
  .route('/admin/stats')
  .get(isAuthenticated, authorizedAdmin, dashboardStats);

export default router;
