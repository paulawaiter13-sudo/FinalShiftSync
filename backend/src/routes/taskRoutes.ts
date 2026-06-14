import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as taskController from '../controllers/taskController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(taskController.list));
router.get('/:id', asyncHandler(taskController.getById));
router.post('/', asyncHandler(taskController.create));
router.patch('/:id', asyncHandler(taskController.update));
router.delete('/:id', asyncHandler(taskController.remove));

export default router;
