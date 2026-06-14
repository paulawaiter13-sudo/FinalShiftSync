import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiInfo, healthCheck } from '../controllers/healthController';

const router = Router();

router.get('/health', asyncHandler(healthCheck));
router.get('/', apiInfo);

export default router;
