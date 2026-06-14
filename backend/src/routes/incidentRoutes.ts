import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as incidentController from '../controllers/incidentController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(incidentController.list));
router.get('/:id', asyncHandler(incidentController.getById));
router.post('/', asyncHandler(incidentController.create));
router.patch('/:id', asyncHandler(incidentController.update));
router.post('/:id/resolve', asyncHandler(incidentController.resolve));
router.post('/:id/notes', asyncHandler(incidentController.addNote));

export default router;
