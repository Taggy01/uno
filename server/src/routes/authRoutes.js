import { Router } from 'express';
import { signup, login, guestSession, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/guest', guestSession);
router.get('/me', authMiddleware, getProfile);

export default router;
