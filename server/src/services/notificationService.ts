import { v4 as uuidv4 } from 'uuid';
import { NotificationItem } from '../types';
import { db } from '../db';

export class NotificationService {
  public static send(params: {
    userId: string;
    title: string;
    message: string;
    type: 'approval' | 'policy' | 'anomaly' | 'budget' | 'reimbursement' | 'system';
    link?: string;
  }): NotificationItem {
    const item: NotificationItem = {
      id: uuidv4(),
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      link: params.link,
      createdAt: new Date().toISOString()
    };

    const list = db.notifications;
    list.unshift(item);
    db.notifications = list;
    return item;
  }

  public static broadcastToRole(
    role: string,
    params: {
      title: string;
      message: string;
      type: 'approval' | 'policy' | 'anomaly' | 'budget' | 'reimbursement' | 'system';
      link?: string;
    }
  ) {
    const targetUsers = db.users.filter(u => u.role === role);
    for (const u of targetUsers) {
      this.send({
        userId: u.id,
        ...params
      });
    }
  }
}
