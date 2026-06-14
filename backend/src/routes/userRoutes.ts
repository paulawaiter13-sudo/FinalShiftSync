import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(userController.getUsers));

export default router;
