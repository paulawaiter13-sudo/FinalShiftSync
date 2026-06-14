import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import * as announcementController from '../controllers/announcementController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(announcementController.list));
router.get('/:id', asyncHandler(announcementController.getById));

router.post(
  '/',
  requireRoles(UserRole.SHIFT_MANAGER, UserRole.ADMIN),
  asyncHandler(announcementController.create)
);

router.patch(
  '/:id',
  requireRoles(UserRole.SHIFT_MANAGER, UserRole.ADMIN),
  asyncHandler(announcementController.update)
);

router.delete(
  '/:id',
  requireRoles(UserRole.SHIFT_MANAGER, UserRole.ADMIN),
  asyncHandler(announcementController.remove)
);

export default router;
