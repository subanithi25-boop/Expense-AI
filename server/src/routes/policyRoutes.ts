import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';
import { CorporatePolicy } from '../types';

const router = Router();

// List all corporate policies
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ policies: db.policies });
});

// Update policy
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  if (user.role !== 'admin' && user.role !== 'finance') {
    return res.status(403).json({ error: 'Only Administrators and Finance can edit corporate policies' });
  }

  const list = db.policies;
  const index = list.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  list[index] = {
    ...list[index],
    ...req.body
  };
  db.policies = list;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'POLICY_CONFIG_UPDATED',
    entityType: 'policy',
    entityId: id,
    details: `Updated policy "${list[index].name}" parameters`
  });

  res.json({ policy: list[index] });
});

export default router;
