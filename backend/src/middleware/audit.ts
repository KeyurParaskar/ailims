import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// In-memory audit log storage (replace with database)
export interface AuditEntry {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

let auditLogs: AuditEntry[] = [];
let nextAuditId = 1;

// Log an audit entry
export const logAudit = (
  userId: number | undefined,
  userEmail: string | undefined,
  action: string,
  entityType: string,
  entityId?: string | number,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  metadata?: Record<string, any>
): AuditEntry => {
  const entry: AuditEntry = {
    id: nextAuditId++,
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    timestamp: new Date(),
    metadata,
  };
  
  auditLogs.push(entry);
  
  // Keep only last 1000 entries in memory (in production, use database)
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(-1000);
  }
  
  return entry;
};

// Get audit logs with filtering
export const getAuditLogs = (filters?: {
  userId?: number;
  entityType?: string;
  entityId?: string | number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): AuditEntry[] => {
  let logs = [...auditLogs];

  if (filters) {
    if (filters.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }
    if (filters.entityId) {
      logs = logs.filter((l) => l.entityId === filters.entityId);
    }
    if (filters.action) {
      logs = logs.filter((l) => l.action.includes(filters.action!));
    }
    if (filters.startDate) {
      logs = logs.filter((l) => l.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter((l) => l.timestamp <= filters.endDate!);
    }
  }

  // Sort by timestamp descending
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
};

// Middleware to automatically log API actions
export const auditMiddleware = (entityType: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = (body: any) => {
      // Log after successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit(
          req.user?.userId,
          req.user?.email,
          action,
          entityType,
          req.params.id as string | undefined,
          req.method === 'PUT' || req.method === 'DELETE' ? body.previous : undefined,
          req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
          {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        );
      }
      return originalJson(body);
    };

    next();
  };
};

export default {
  logAudit,
  getAuditLogs,
  auditMiddleware,
};
