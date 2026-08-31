import { Router } from 'express';
import { signup, login, guestSession, getProfile, sendOtp, verifyOtpAndSignup, changePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndSignup);
router.post('/login', login);
router.post('/guest', guestSession);
router.get('/me', authMiddleware, getProfile);
router.post('/change-password', authMiddleware, changePassword);

export default router;

