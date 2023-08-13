import express from 'express';
import {
  register,
  login,
  logout,
  getMyProfile,
  updatePassword,
  updateProfile,
  updateProfilePicture,
  forgetpassword,
  resetPassword,
  addToPlaylist,
  removeFromPlaylist,
  getAllUsers,
  updateUserRole,
  deleteUser,
  deleteMyProfile,
} from '../controllers/userController.js';
import { authorizedAdmin, isAuthenticated } from '../middlewares/auth.js';
import singleUpload from '../middlewares/multer.js';
const router = express.Router();

router.route('/register').post(singleUpload, register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/me').get(isAuthenticated, getMyProfile);
router.route('/me').delete(isAuthenticated, deleteMyProfile);
router.route('/updatepassword').put(isAuthenticated, updatePassword);
router.route('/updateprofile').put(isAuthenticated, updateProfile);
router
  .route('/updateprofilepicture')
  .put(isAuthenticated, singleUpload, updateProfilePicture);
router.route('/forgetpassword').post(forgetpassword);
router.route('/resetpassword/:token').put(resetPassword);
router.route('/addToPlaylist').post(isAuthenticated, addToPlaylist);
router.route('/removeFromPlaylist').delete(isAuthenticated, removeFromPlaylist);

//Admin routes
router.route('/admin/users').get(isAuthenticated, authorizedAdmin, getAllUsers);
router
  .route('/admin/user/:id')
  .put(isAuthenticated, authorizedAdmin, updateUserRole)
  .delete(isAuthenticated, authorizedAdmin, deleteUser);
export default router;
