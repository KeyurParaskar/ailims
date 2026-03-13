import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole, ROLES, AuthRequest } from '../middleware/auth';
import { getAuditLogs, logAudit } from '../middleware/audit';

const router = Router();

// Get audit logs (admin and lab_manager only)
router.get(
  '/',
  authenticateToken,
  requireRole(ROLES.ADMIN, ROLES.LAB_MANAGER),
  (req: AuthRequest, res: Response) => {
    const { userId, entityType, entityId, action, startDate, endDate, limit } = req.query;

    const filters: any = {};
    if (userId) filters.userId = parseInt(userId as string);
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const logs = getAuditLogs(filters);
    res.json({ logs, count: logs.length });
  }
);

// Get audit logs for a specific entity
router.get(
  '/:entityType/:entityId',
  authenticateToken,
  requireRole(ROLES.ADMIN, ROLES.LAB_MANAGER, ROLES.LAB_TECH),
  (req: AuthRequest, res: Response) => {
    const { entityType, entityId } = req.params;
    const logs = getAuditLogs({ entityType, entityId });
    res.json({ logs, count: logs.length });
  }
);

// Manual audit entry (for custom events)
router.post(
  '/',
  authenticateToken,
  (req: AuthRequest, res: Response) => {
    const { action, entityType, entityId, oldValues, newValues, metadata } = req.body;

    if (!action || !entityType) {
      return res.status(400).json({ error: 'Action and entityType are required' });
    }

    const entry = logAudit(
      req.user?.userId,
      req.user?.email,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata
    );

    res.status(201).json({ success: true, entry });
  }
);

export default router;
