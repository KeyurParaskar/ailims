import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// In-memory notifications storage (replace with database)
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

let notifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    title: 'Welcome to AI-LIMS',
    message: 'Your account has been set up successfully.',
    type: 'success',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    title: 'Sample Ready for Review',
    message: 'Sample #A1234 has completed analysis and is ready for review.',
    type: 'info',
    isRead: false,
    createdAt: new Date(),
  },
];

let nextNotificationId = 3;

// Get user notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userNotifications = notifications
    .filter((n) => n.userId === req.user?.userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({
    notifications: userNotifications,
    unreadCount: userNotifications.filter((n) => !n.isRead).length,
  });
});

// Create notification (internal use or admin)
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { userId, title, message, type, metadata } = req.body;

  const notification: Notification = {
    id: nextNotificationId++,
    userId: userId || req.user?.userId || 0,
    title,
    message,
    type: type || 'info',
    isRead: false,
    createdAt: new Date(),
    metadata,
  };

  notifications.push(notification);
  res.status(201).json({ success: true, notification });
});

// Mark notification as read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const notificationId = parseInt(req.params.id);
  const notification = notifications.find(
    (n) => n.id === notificationId && n.userId === req.user?.userId
  );

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.isRead = true;
  res.json({ success: true, notification });
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  notifications
    .filter((n) => n.userId === req.user?.userId)
    .forEach((n) => (n.isRead = true));

  res.json({ success: true, message: 'All notifications marked as read' });
});

// Delete notification
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const notificationId = parseInt(req.params.id);
  const index = notifications.findIndex(
    (n) => n.id === notificationId && n.userId === req.user?.userId
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notifications.splice(index, 1);
  res.json({ success: true, message: 'Notification deleted' });
});

// Utility function to create notifications (for use in other routes)
export const createNotification = (
  userId: number,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  metadata?: Record<string, any>
) => {
  const notification: Notification = {
    id: nextNotificationId++,
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date(),
    metadata,
  };
  notifications.push(notification);
  return notification;
};

export default router;
