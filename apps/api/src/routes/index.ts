import { Router } from 'express';
import authRoutes         from './v1/auth.routes';
import businessRoutes     from './v1/business.routes';
import importRoutes       from './v1/import.routes';
import templateRoutes     from './v1/template.routes';
import emailRoutes        from './v1/email.routes';
import dashboardRoutes    from './v1/dashboard.routes';
import billingRoutes      from './v1/billing.routes';
import accountRoutes      from './v1/account.routes';
import notificationRoutes from './v1/notification.routes';
import teamRoutes         from './v1/team.routes';
import adminRoutes        from './admin.routes';

const router = Router();

// API v1
router.use('/v1/auth',          authRoutes);
router.use('/v1/businesses',    businessRoutes);
router.use('/v1/imports',       importRoutes);
router.use('/v1/templates',     templateRoutes);
router.use('/v1/email',         emailRoutes);
router.use('/v1/dashboard',     dashboardRoutes);
router.use('/v1/billing',       billingRoutes);
router.use('/v1/account',       accountRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/team',          teamRoutes);

// Admin panel API
router.use('/admin', adminRoutes);

export default router;
