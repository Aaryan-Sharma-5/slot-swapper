import express from 'express';
import {
  getSwappableSlots,
  createSwapRequest,
  respondToSwapRequest,
  getMySwapRequests,
} from '../controllers/swapController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/swappable-slots', getSwappableSlots);
router.post('/swap-request', createSwapRequest);
router.post('/swap-response/:requestId', respondToSwapRequest);
router.get('/my-requests', getMySwapRequests);

export default router;
