import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as shiftController from '../controllers/shiftController';
import * as summaryController from '../controllers/summaryController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(shiftController.list));
router.get('/current', asyncHandler(shiftController.current));
router.get('/:id/summary', asyncHandler(summaryController.getByShift));
router.post('/:id/generate-summary', asyncHandler(summaryController.generate));
router.get('/:id', asyncHandler(shiftController.getById));
router.post('/', asyncHandler(shiftController.create));
router.patch('/:id', asyncHandler(shiftController.update));
router.post('/:id/start', asyncHandler(shiftController.start));
router.post('/:id/end', asyncHandler(shiftController.end));

export default router;
