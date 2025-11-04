import express from 'express';
import { getMyEvents, createEvent, updateEventStatus, deleteEvent } from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMyEvents);
router.post('/', createEvent);
router.patch('/:id/status', updateEventStatus);
router.delete('/:id', deleteEvent);

export default router;
