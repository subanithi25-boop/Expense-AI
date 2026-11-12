import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Get notifications for current user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userNotifications = db.notifications.filter(n => n.userId === user.id);
  res.json({ notifications: userNotifications });
});

// Mark single notification as read
router.put('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const list = db.notifications;
  const item = list.find(n => n.id === id && n.userId === user.id);

  if (item) {
    item.read = true;
    db.notifications = list;
  }

  res.json({ success: true });
});

// Mark all as read
router.post('/mark-all-read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const list = db.notifications;
  let modified = false;
  for (const n of list) {
    if (n.userId === user.id && !n.read) {
      n.read = true;
      modified = true;
    }
  }
  if (modified) {
    db.notifications = list;
  }
  res.json({ success: true });
});

export default router;
