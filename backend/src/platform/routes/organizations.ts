/**
 * Organizations & Data Transfer API Routes
 * Multi-tenant management, data copy/transfer between organizations
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to get userId as string
const getUserId = (req: AuthRequest): string | undefined => {
  return req.user?.userId ? String(req.user.userId) : undefined;
};

// Helper to get param as string
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// =============================================================================
// TYPES
// =============================================================================

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: {
    timezone: string;
    dateFormat: string;
    labType?: string;
    features: string[];
  };
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    maxUsers: number;
    maxModules: number;
    maxRecords: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

interface OrgMembership {
  id: string;
  orgId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  invitedBy?: string;
}

interface DataTransfer {
  id: string;
  sourceOrgId: string;
  targetOrgId: string;
  moduleId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  transferType: 'copy' | 'move';
  recordFilter?: object;
  recordCount: number;
  transferredCount: number;
  errors: any[];
  createdAt: Date;
  completedAt?: Date;
  createdBy?: string;
}

// =============================================================================
// IN-MEMORY STORAGE
// =============================================================================

const organizations: Map<string, Organization> = new Map();
const memberships: Map<string, OrgMembership> = new Map();
const dataTransfers: Map<string, DataTransfer> = new Map();

// Initialize default organization
organizations.set('org-default', {
  id: 'org-default',
  name: 'Default Organization',
  slug: 'default',
  description: 'Default organization for single-tenant mode',
  settings: {
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    features: ['modules', 'workflows', 'reports'],
  },
  subscription: {
    plan: 'enterprise',
    maxUsers: 999,
    maxModules: 999,
    maxRecords: 999999,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// =============================================================================
// ORGANIZATION ENDPOINTS
// =============================================================================

/**
 * GET /api/organizations
 * List all organizations (admin only in multi-tenant, or user's orgs)
 */
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  
  // Get user's organization memberships
  const userMemberships = Array.from(memberships.values()).filter(m => m.userId === userId);
  const userOrgIds = new Set(userMemberships.map(m => m.orgId));
  
  // Filter to user's organizations
  const userOrgs = Array.from(organizations.values()).filter(o => userOrgIds.has(o.id));
  
  res.json({
    organizations: userOrgs.map(org => ({
      ...org,
      role: userMemberships.find(m => m.orgId === org.id)?.role,
    })),
  });
});

/**
 * GET /api/organizations/:orgId
 * Get organization details
 */
router.get('/:orgId', authenticateToken, (req: AuthRequest, res: Response) => {
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  // Get member count
  const memberCount = Array.from(memberships.values()).filter(m => m.orgId === org.id).length;
  
  res.json({
    ...org,
    memberCount,
  });
});

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { name, description, settings } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Organization name is required' });
  }
  
  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check slug uniqueness
  const existingSlug = Array.from(organizations.values()).find(o => o.slug === slug);
  if (existingSlug) {
    return res.status(409).json({ error: 'Organization with this name already exists' });
  }
  
  const org: Organization = {
    id: uuidv4(),
    name,
    slug,
    description,
    settings: {
      timezone: settings?.timezone || 'UTC',
      dateFormat: settings?.dateFormat || 'YYYY-MM-DD',
      labType: settings?.labType,
      features: ['modules', 'workflows', 'reports'],
    },
    subscription: {
      plan: 'free',
      maxUsers: 3,
      maxModules: 5,
      maxRecords: 1000,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
  };
  
  organizations.set(org.id, org);
  
  // Add creator as owner
  const membership: OrgMembership = {
    id: uuidv4(),
    orgId: org.id,
    userId: userId || '',
    role: 'owner',
    permissions: ['*'],
    joinedAt: new Date(),
  };
  memberships.set(membership.id, membership);
  
  res.status(201).json({ organization: org, membership });
});

/**
 * PUT /api/organizations/:orgId
 * Update organization
 */
router.put('/:orgId', authenticateToken, (req: AuthRequest, res: Response) => {
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const { name, description, settings } = req.body;
  
  if (name) org.name = name;
  if (description !== undefined) org.description = description;
  if (settings) {
    org.settings = { ...org.settings, ...settings };
  }
  org.updatedAt = new Date();
  
  organizations.set(org.id, org);
  
  res.json({ organization: org });
});

/**
 * DELETE /api/organizations/:orgId
 * Delete organization (owner only)
 */
router.delete('/:orgId', authenticateToken, (req: AuthRequest, res: Response) => {
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  if (org.id === 'org-default') {
    return res.status(403).json({ error: 'Cannot delete default organization' });
  }
  
  // Remove all memberships
  for (const [key, membership] of memberships.entries()) {
    if (membership.orgId === org.id) {
      memberships.delete(key);
    }
  }
  
  organizations.delete(org.id);
  
  res.json({ success: true, message: 'Organization deleted' });
});

// =============================================================================
// MEMBERSHIP ENDPOINTS
// =============================================================================

/**
 * GET /api/organizations/:orgId/members
 * List organization members
 */
router.get('/:orgId/members', authenticateToken, (req: AuthRequest, res: Response) => {
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const orgMemberships = Array.from(memberships.values()).filter(m => m.orgId === org.id);
  
  res.json({
    members: orgMemberships.map(m => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      permissions: m.permissions,
      joinedAt: m.joinedAt,
    })),
    total: orgMemberships.length,
  });
});

/**
 * POST /api/organizations/:orgId/members
 * Add member to organization
 */
router.post('/:orgId/members', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const { email, role = 'member', permissions = [] } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // TODO: Look up user by email, create invitation if not found
  const newUserId = `user-${email.split('@')[0]}`;
  
  // Check if already member
  const existing = Array.from(memberships.values()).find(
    m => m.orgId === org.id && m.userId === newUserId
  );
  if (existing) {
    return res.status(409).json({ error: 'User is already a member' });
  }
  
  // Check member limit
  const currentMembers = Array.from(memberships.values()).filter(m => m.orgId === org.id).length;
  if (currentMembers >= org.subscription.maxUsers) {
    return res.status(403).json({ error: 'Organization has reached member limit' });
  }
  
  const membership: OrgMembership = {
    id: uuidv4(),
    orgId: org.id,
    userId: newUserId,
    role: role as OrgMembership['role'],
    permissions,
    joinedAt: new Date(),
    invitedBy: userId,
  };
  
  memberships.set(membership.id, membership);
  
  res.status(201).json({ membership });
});

/**
 * PUT /api/organizations/:orgId/members/:membershipId
 * Update member role/permissions
 */
router.put('/:orgId/members/:membershipId', authenticateToken, (req: AuthRequest, res: Response) => {
  const membershipId = getParam(req.params.membershipId);
  const orgId = getParam(req.params.orgId);
  const membership = memberships.get(membershipId);
  
  if (!membership || membership.orgId !== orgId) {
    return res.status(404).json({ error: 'Membership not found' });
  }
  
  const { role, permissions } = req.body;
  
  if (role) membership.role = role;
  if (permissions) membership.permissions = permissions;
  
  memberships.set(membership.id, membership);
  
  res.json({ membership });
});

/**
 * DELETE /api/organizations/:orgId/members/:membershipId
 * Remove member from organization
 */
router.delete('/:orgId/members/:membershipId', authenticateToken, (req: AuthRequest, res: Response) => {
  const membershipId = getParam(req.params.membershipId);
  const orgId = getParam(req.params.orgId);
  const membership = memberships.get(membershipId);
  
  if (!membership || membership.orgId !== orgId) {
    return res.status(404).json({ error: 'Membership not found' });
  }
  
  if (membership.role === 'owner') {
    return res.status(403).json({ error: 'Cannot remove organization owner' });
  }
  
  memberships.delete(membership.id);
  
  res.json({ success: true, message: 'Member removed' });
});

// =============================================================================
// DATA TRANSFER ENDPOINTS
// =============================================================================

/**
 * GET /api/organizations/:orgId/transfers
 * List data transfers for organization
 */
router.get('/:orgId/transfers', authenticateToken, (req: AuthRequest, res: Response) => {
  const org = organizations.get(getParam(req.params.orgId));
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const transfers = Array.from(dataTransfers.values()).filter(
    t => t.sourceOrgId === org.id || t.targetOrgId === org.id
  );
  
  res.json({
    transfers: transfers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    total: transfers.length,
  });
});

/**
 * POST /api/organizations/:orgId/transfers
 * Initiate data transfer
 */
router.post('/:orgId/transfers', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const sourceOrg = organizations.get(getParam(req.params.orgId));
  
  if (!sourceOrg) {
    return res.status(404).json({ error: 'Source organization not found' });
  }
  
  const { targetOrgId, moduleId, transferType = 'copy', recordFilter } = req.body;
  
  if (!targetOrgId || !moduleId) {
    return res.status(400).json({ error: 'targetOrgId and moduleId are required' });
  }
  
  const targetOrg = organizations.get(targetOrgId);
  if (!targetOrg) {
    return res.status(404).json({ error: 'Target organization not found' });
  }
  
  // TODO: Check user has permission on both orgs
  // TODO: Check target org has capacity
  // TODO: Validate module exists
  
  const transfer: DataTransfer = {
    id: uuidv4(),
    sourceOrgId: sourceOrg.id,
    targetOrgId: targetOrg.id,
    moduleId,
    status: 'pending',
    transferType,
    recordFilter,
    recordCount: 0,
    transferredCount: 0,
    errors: [],
    createdAt: new Date(),
    createdBy: userId,
  };
  
  dataTransfers.set(transfer.id, transfer);
  
  // Start transfer process (in real implementation, this would be async/background job)
  processTransfer(transfer.id);
  
  res.status(201).json({ transfer });
});

/**
 * GET /api/organizations/:orgId/transfers/:transferId
 * Get transfer status
 */
router.get('/:orgId/transfers/:transferId', authenticateToken, (req: AuthRequest, res: Response) => {
  const transfer = dataTransfers.get(getParam(req.params.transferId));
  
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }
  
  res.json({ transfer });
});

/**
 * POST /api/organizations/:orgId/transfers/:transferId/cancel
 * Cancel a pending transfer
 */
router.post('/:orgId/transfers/:transferId/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  const transfer = dataTransfers.get(getParam(req.params.transferId));
  
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }
  
  if (transfer.status === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel completed transfer' });
  }
  
  transfer.status = 'failed';
  transfer.errors.push({ message: 'Cancelled by user', at: new Date() });
  dataTransfers.set(transfer.id, transfer);
  
  res.json({ success: true, message: 'Transfer cancelled' });
});

// =============================================================================
// TRANSFER PROCESSING (Simplified - would be background job in production)
// =============================================================================

async function processTransfer(transferId: string) {
  const transfer = dataTransfers.get(transferId);
  if (!transfer) return;
  
  transfer.status = 'in_progress';
  dataTransfers.set(transferId, transfer);
  
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation:
    // 1. Fetch records from source module
    // 2. Copy module definition if it doesn't exist in target
    // 3. Transform data if needed (field mappings)
    // 4. Insert records into target
    // 5. If transferType === 'move', delete from source
    
    transfer.status = 'completed';
    transfer.completedAt = new Date();
  } catch (error: any) {
    transfer.status = 'failed';
    transfer.errors.push({
      message: error.message || 'Transfer failed',
      at: new Date(),
    });
  }
  
  dataTransfers.set(transferId, transfer);
}

// =============================================================================
// TEMPLATE SHARING ENDPOINTS
// =============================================================================

/**
 * POST /api/organizations/:orgId/modules/:moduleId/share
 * Share a module template with another organization
 */
router.post('/:orgId/modules/:moduleId/share', authenticateToken, (req: AuthRequest, res: Response) => {
  const { targetOrgId } = req.body;
  
  if (!targetOrgId) {
    return res.status(400).json({ error: 'targetOrgId is required' });
  }
  
  // In real implementation:
  // 1. Get module definition
  // 2. Create a copy in target org (as draft)
  // 3. Don't copy data, only schema
  
  res.json({
    success: true,
    message: 'Module template shared',
    // Would return the new module ID in target org
  });
});

export default router;

// Export helper to check org membership
export function checkOrgMembership(userId: string, orgId: string): OrgMembership | undefined {
  return Array.from(memberships.values()).find(
    m => m.userId === userId && m.orgId === orgId
  );
}

// Export helper to get org by ID
export function getOrganization(orgId: string): Organization | undefined {
  return organizations.get(orgId);
}
