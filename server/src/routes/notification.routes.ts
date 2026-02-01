import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
