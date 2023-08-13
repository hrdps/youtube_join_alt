import express from 'express';
const router = express.Router();
import {
  authorizedAdmin,
  authorizedSubscriber,
  isAuthenticated,
} from '../middlewares/auth.js';
import {
  cancelSubscription,
  getRazorpayKey,
  paymentVerification,
  subscription,
} from '../controllers/paymentController.js';

router.route('/subscribe').get(isAuthenticated, subscription);
router.route('/paymentkey').get(getRazorpayKey);
router.route('/paymentverification').post(isAuthenticated, paymentVerification);
router
  .route('/cancelsubscription')
  .delete(isAuthenticated, authorizedSubscriber, cancelSubscription);

export default router;
