import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as alertController from '../controllers/alertController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(alertController.list));
router.post('/generate', asyncHandler(alertController.generate));
router.get('/:id', asyncHandler(alertController.getById));
router.patch('/:id/acknowledge', asyncHandler(alertController.acknowledge));
router.patch('/:id/dismiss', asyncHandler(alertController.dismiss));
router.post('/:id/convert-to-incident', asyncHandler(alertController.convertToIncident));

export default router;
