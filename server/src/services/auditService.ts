import { v4 as uuidv4 } from 'uuid';
import { AuditLog, UserRole } from '../types';
import { db } from '../db';

export class AuditService {
  public static log(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    entityType: 'expense' | 'report' | 'policy' | 'budget' | 'user' | 'integration';
    entityId: string;
    details: string;
  }): AuditLog {
    const logItem: AuditLog = {
      id: uuidv4(),
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      timestamp: new Date().toISOString()
    };

    const current = db.auditLogs;
    current.unshift(logItem); // newest first
    if (current.length > 500) {
      current.pop();
    }
    db.auditLogs = current;

    return logItem;
  }
}
