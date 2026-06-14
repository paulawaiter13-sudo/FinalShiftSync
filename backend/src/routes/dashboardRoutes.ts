import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);
router.get('/overview', asyncHandler(dashboardController.overview));

export default router;
