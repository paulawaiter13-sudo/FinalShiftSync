import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as summaryController from '../controllers/summaryController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(summaryController.list));
router.get('/:id', asyncHandler(summaryController.getById));
router.patch('/:id', asyncHandler(summaryController.update));

export default router;
