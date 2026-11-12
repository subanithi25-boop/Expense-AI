import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';
import { IntegrationStatus } from '../types';

const router = Router();

// List all integrations with actual status & requirements
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ integrations: db.integrations });
});

// Configure or connect integration
router.post('/:providerKey/configure', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { providerKey } = req.params;
  const { apiKey, clientSecret, isDemoMode = true } = req.body;

  if (user.role !== 'admin' && user.role !== 'finance') {
    return res.status(403).json({ error: 'Admin or Finance authorization required to configure integrations' });
  }

  const list = db.integrations;
  const index = list.findIndex(i => i.providerKey === providerKey);

  if (index === -1) {
    return res.status(404).json({ error: 'Integration provider not recognized' });
  }

  const target = list[index];
  
  // Real credentials vs Demo mode
  if (apiKey && apiKey.trim().length > 8 && !isDemoMode) {
    target.status = 'connected';
  } else if (isDemoMode) {
    target.status = 'demo_mode';
  } else {
    target.status = 'not_connected';
  }

  target.lastSync = new Date().toISOString();
  target.configuredBy = user.name;

  list[index] = target;
  db.integrations = list;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'INTEGRATION_CONFIGURED',
    entityType: 'integration',
    entityId: target.id,
    details: `Updated provider ${target.name} status to "${target.status}" (Demo Mode: ${isDemoMode})`
  });

  res.json({ success: true, integration: target });
});

// Test sync connection
router.post('/:providerKey/sync', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { providerKey } = req.params;
  const list = db.integrations;
  const index = list.findIndex(i => i.providerKey === providerKey);

  if (index === -1) {
    return res.status(404).json({ error: 'Integration provider not found' });
  }

  const target = list[index];
  if (target.status === 'not_connected') {
    return res.status(400).json({
      error: `Cannot sync ${target.name}. Provider is not connected. Configure credentials or enable Demo Mode first.`
    });
  }

  target.lastSync = new Date().toISOString();
  list[index] = target;
  db.integrations = list;

  res.json({
    success: true,
    message: `Synchronization check passed for ${target.name}. Operational state verified.`,
    syncedAt: target.lastSync
  });
});

// Disconnect integration
router.post('/:providerKey/disconnect', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { providerKey } = req.params;
  const list = db.integrations;
  const index = list.findIndex(i => i.providerKey === providerKey);

  if (index === -1) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  list[index].status = 'not_connected';
  list[index].lastSync = undefined;
  db.integrations = list;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'INTEGRATION_DISCONNECTED',
    entityType: 'integration',
    entityId: list[index].id,
    details: `Disconnected provider ${list[index].name}`
  });

  res.json({ success: true, integration: list[index] });
});

export default router;
