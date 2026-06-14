import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import userRoutes from './userRoutes';
import shiftRoutes from './shiftRoutes';
import incidentRoutes from './incidentRoutes';
import taskRoutes from './taskRoutes';
import alertRoutes from './alertRoutes';
import summaryRoutes from './summaryRoutes';
import announcementRoutes from './announcementRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/shifts', shiftRoutes);
router.use('/incidents', incidentRoutes);
router.use('/tasks', taskRoutes);
router.use('/alerts', alertRoutes);
router.use('/summaries', summaryRoutes);
router.use('/announcements', announcementRoutes);

export default router;
