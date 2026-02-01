import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get user's notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { unreadOnly, limit = 20, offset = 0 } = req.query;

        let query = db('notifications')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc')
            .limit(Number(limit))
            .offset(Number(offset));

        if (unreadOnly === 'true') {
            query = query.where({ is_read: false });
        }

        const notifications = await query;

        const unreadCount = await db('notifications')
            .where({ user_id: userId, is_read: false })
            .count('id as count')
            .first();

        res.json({
            data: notifications,
            unreadCount: Number(unreadCount?.count || 0)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const updated = await db('notifications')
            .where({ id, user_id: userId })
            .update({ is_read: true, read_at: new Date() });

        if (!updated) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await db('notifications')
            .where({ user_id: userId, is_read: false })
            .update({ is_read: true, read_at: new Date() });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications' });
    }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const deleted = await db('notifications')
            .where({ id, user_id: userId })
            .delete();

        if (!deleted) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Get unread count only (for badge)
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const result = await db('notifications')
            .where({ user_id: userId, is_read: false })
            .count('id as count')
            .first();

        res.json({ count: Number(result?.count || 0) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get count' });
    }
};

// Helper function to create notification (for internal use)
export const createNotification = async (
    userId: string,
    type: 'survey_assigned' | 'survey_reminder' | 'survey_expired' | 'system',
    title: string,
    message?: string,
    data?: Record<string, any>
) => {
    try {
        await db('notifications').insert({
            id: uuidv4(),
            user_id: userId,
            type,
            title,
            message,
            data: JSON.stringify(data || {}),
            is_read: false,
            created_at: new Date()
        });
        return true;
    } catch (error) {
        console.error('Create notification error:', error);
        return false;
    }
};

// Notify users about new survey (called when survey is activated)
export const notifySurveyAssigned = async (surveyId: string, companyId: string, surveyTitle: string) => {
    try {
        // Get all regular users in the company
        const users = await db('users')
            .where({ company_id: companyId, role: 'user' })
            .select('id');

        // Create notifications for each user
        for (const user of users) {
            await createNotification(
                user.id,
                'survey_assigned',
                'New Survey Available',
                `You have been invited to take "${surveyTitle}"`,
                { surveyId }
            );
        }

        return users.length;
    } catch (error) {
        console.error('Notify survey assigned error:', error);
        return 0;
    }
};
