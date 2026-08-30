import { Router } from 'express';
import { createRoom, getPublicRooms, getRoomDetails } from '../controllers/roomController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/create', authMiddleware, createRoom);
router.get('/', getPublicRooms);
router.get('/:code', getRoomDetails);

export default router;
