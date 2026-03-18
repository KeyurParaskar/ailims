/**
 * Dynamic Data API Routes
 * CRUD operations for module records (data)
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { validateModuleData } from '../validation-engine';
import { ModuleDefinition, ModuleRecord, ValidationResult } from '../types';
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
// IN-MEMORY STORAGE (Replace with database in production)
// =============================================================================

// Records stored as Map<moduleId, Map<recordId, record>>
const moduleRecords: Map<string, Map<string, ModuleRecord>> = new Map();

// Default organization for single-tenant testing
const DEFAULT_ORG_ID = 'org-default';

// Module definitions reference (will be shared or fetched from DB)
let getModuleDefinition: (orgId: string, moduleId: string) => ModuleDefinition | undefined;

export function setModuleDefinitionGetter(getter: typeof getModuleDefinition) {
  getModuleDefinition = getter;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRecordsMap(moduleId: string): Map<string, ModuleRecord> {
  if (!moduleRecords.has(moduleId)) {
    moduleRecords.set(moduleId, new Map());
  }
  return moduleRecords.get(moduleId)!;
}

function generateAutoNumber(pattern: string, sequence: number): string {
  // Pattern: "SAM-{YYYY}-{0000}" => "SAM-2024-0001"
  const now = new Date();
  return pattern
    .replace('{YYYY}', now.getFullYear().toString())
    .replace('{YY}', now.getFullYear().toString().slice(-2))
    .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
    .replace('{DD}', now.getDate().toString().padStart(2, '0'))
    .replace(/\{0+\}/, (match) => sequence.toString().padStart(match.length - 2, '0'));
}

// Auto-number sequences per module
const autoNumberSequences: Map<string, number> = new Map();

function getNextAutoNumber(moduleId: string, fieldId: string): number {
  const key = `${moduleId}:${fieldId}`;
  const current = autoNumberSequences.get(key) || 0;
  const next = current + 1;
  autoNumberSequences.set(key, next);
  return next;
}

// =============================================================================
// MODULE DATA ENDPOINTS
// =============================================================================

/**
 * GET /api/data/:moduleId
 * List records for a module with filtering, sorting, pagination
 */
router.get('/:moduleId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const moduleId = getParam(req.params.moduleId);
  const { 
    page = '1', 
    limit = '50', 
    sort = 'created_at', 
    order = 'desc',
    status,
    search,
    ...filters 
  } = req.query;
  
  // Get module definition
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  let results = Array.from(records.values());
  
  // Filter by status
  if (status && typeof status === 'string') {
    results = results.filter(r => r.status === status);
  }
  
  // Apply field filters
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string') {
      results = results.filter(r => {
        const fieldValue = r.data[key];
        if (fieldValue === undefined) return false;
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(value.toLowerCase());
        }
        return fieldValue == value;
      });
    }
  }
  
  // Global search across all text fields
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    results = results.filter(r => {
      return Object.values(r.data).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }
  
  // Sort
  const sortField = sort as string;
  const sortOrder = order === 'asc' ? 1 : -1;
  results.sort((a, b) => {
    let aVal: any, bVal: any;
    
    if (sortField === 'created_at') {
      aVal = a.createdAt;
      bVal = b.createdAt;
    } else if (sortField === 'updated_at') {
      aVal = a.updatedAt;
      bVal = b.updatedAt;
    } else {
      aVal = a.data[sortField];
      bVal = b.data[sortField];
    }
    
    if (aVal < bVal) return -1 * sortOrder;
    if (aVal > bVal) return 1 * sortOrder;
    return 0;
  });
  
  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 500);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedResults = results.slice(startIndex, startIndex + limitNum);
  
  res.json({
    records: paginatedResults,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: results.length,
      totalPages: Math.ceil(results.length / limitNum),
    },
    module: {
      id: module.moduleId,
      name: module.name,
      fieldCount: module.config.fields.length,
    },
  });
});

/**
 * GET /api/data/:moduleId/:recordId
 * Get a single record
 */
router.get('/:moduleId/:recordId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const moduleId = getParam(req.params.moduleId);
  const recordId = getParam(req.params.recordId);
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const record = records.get(recordId);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  res.json({
    record,
    module: {
      id: module.moduleId,
      name: module.name,
      config: module.config,
    },
  });
});

/**
 * POST /api/data/:moduleId
 * Create a new record
 */
router.post('/:moduleId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const { data, status = 'draft' } = req.body;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  if (module.status !== 'active') {
    return res.status(400).json({ error: 'Module is not active' });
  }
  
  // Process auto-number fields
  const processedData = { ...data };
  for (const field of module.config.fields) {
    if (field.type === 'autonumber') {
      const sequence = getNextAutoNumber(moduleId, field.id);
      const pattern = field.config?.pattern || '{0000}';
      processedData[field.id] = generateAutoNumber(pattern, sequence);
    }
  }
  
  // Validate data
  const validation = validateModuleData(processedData, module.config.fields);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: validation.errors,
    });
  }
  
  // Create record
  const record: ModuleRecord = {
    id: uuidv4(),
    moduleId,
    orgId,
    data: processedData,
    status,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
  
  const records = getRecordsMap(moduleId);
  records.set(record.id, record);
  
  res.status(201).json({ record });
});

/**
 * PUT /api/data/:moduleId/:recordId
 * Update a record
 */
router.put('/:moduleId/:recordId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const recordId = getParam(req.params.recordId);
  const { data, status } = req.body;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const record = records.get(recordId);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  // Merge data
  const updatedData = { ...record.data, ...data };
  
  // Validate data
  const validation = validateModuleData(updatedData, module.config.fields);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: validation.errors,
    });
  }
  
  // Update record
  record.data = updatedData;
  if (status) record.status = status;
  record.version += 1;
  record.updatedAt = new Date();
  record.updatedBy = userId;
  
  records.set(recordId, record);
  
  res.json({ record });
});

/**
 * PATCH /api/data/:moduleId/:recordId
 * Partial update a record (specific fields only)
 */
router.patch('/:moduleId/:recordId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const recordId = getParam(req.params.recordId);
  const { fields, status } = req.body;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const record = records.get(recordId);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  // Update only specified fields
  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      // Check field exists in module
      const fieldDef = module.config.fields.find(f => f.id === key);
      if (!fieldDef) {
        return res.status(400).json({ error: `Unknown field: ${key}` });
      }
      
      // Check field is not readonly
      if (fieldDef.type === 'autonumber' || fieldDef.config?.readonly) {
        return res.status(400).json({ error: `Field ${key} is read-only` });
      }
      
      record.data[key] = value;
    }
  }
  
  if (status) record.status = status;
  record.version += 1;
  record.updatedAt = new Date();
  record.updatedBy = userId;
  
  records.set(recordId, record);
  
  res.json({ record });
});

/**
 * DELETE /api/data/:moduleId/:recordId
 * Delete a record (soft delete)
 */
router.delete('/:moduleId/:recordId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const recordId = getParam(req.params.recordId);
  const { hard = false } = req.query;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const record = records.get(recordId);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  if (hard === 'true') {
    // Hard delete
    records.delete(recordId);
    res.json({ success: true, message: 'Record permanently deleted' });
  } else {
    // Soft delete
    record.status = 'deleted';
    record.deletedAt = new Date();
    record.deletedBy = userId;
    record.updatedAt = new Date();
    record.updatedBy = userId;
    records.set(recordId, record);
    res.json({ success: true, message: 'Record deleted' });
  }
});

/**
 * POST /api/data/:moduleId/:recordId/restore
 * Restore a soft-deleted record
 */
router.post('/:moduleId/:recordId/restore', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const recordId = getParam(req.params.recordId);
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const record = records.get(recordId);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  if (record.status !== 'deleted') {
    return res.status(400).json({ error: 'Record is not deleted' });
  }
  
  record.status = 'draft';
  record.deletedAt = undefined;
  record.deletedBy = undefined;
  record.updatedAt = new Date();
  record.updatedBy = userId;
  
  records.set(recordId, record);
  
  res.json({ success: true, message: 'Record restored', record });
});

/**
 * POST /api/data/:moduleId/bulk
 * Bulk create records
 */
router.post('/:moduleId/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const moduleId = getParam(req.params.moduleId);
  const { records: inputRecords } = req.body;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  if (!Array.isArray(inputRecords) || inputRecords.length === 0) {
    return res.status(400).json({ error: 'records array is required' });
  }
  
  if (inputRecords.length > 1000) {
    return res.status(400).json({ error: 'Maximum 1000 records per bulk operation' });
  }
  
  const results: { success: ModuleRecord[]; errors: any[] } = {
    success: [],
    errors: [],
  };
  
  const recordsMap = getRecordsMap(moduleId);
  
  for (let i = 0; i < inputRecords.length; i++) {
    const { data, status = 'draft' } = inputRecords[i];
    
    // Process auto-number fields
    const processedData = { ...data };
    for (const field of module.config.fields) {
      if (field.type === 'autonumber') {
        const sequence = getNextAutoNumber(moduleId, field.id);
        const pattern = field.config?.pattern || '{0000}';
        processedData[field.id] = generateAutoNumber(pattern, sequence);
      }
    }
    
    // Validate
    const validation = validateModuleData(processedData, module.config.fields);
    if (!validation.valid) {
      results.errors.push({
        index: i,
        errors: validation.errors,
      });
      continue;
    }
    
    // Create record
    const record: ModuleRecord = {
      id: uuidv4(),
      moduleId,
      orgId,
      data: processedData,
      status,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    };
    
    recordsMap.set(record.id, record);
    results.success.push(record);
  }
  
  res.status(207).json({
    created: results.success.length,
    failed: results.errors.length,
    records: results.success,
    errors: results.errors,
  });
});

/**
 * POST /api/data/:moduleId/search
 * Advanced search with complex filters
 */
router.post('/:moduleId/search', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const moduleId = getParam(req.params.moduleId);
  const { 
    filters = [],
    sort = [{ field: 'created_at', order: 'desc' }],
    page = 1,
    limit = 50,
  } = req.body;
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  let results = Array.from(records.values());
  
  // Apply filters
  for (const filter of filters) {
    const { field, operator, value } = filter;
    
    results = results.filter(r => {
      const fieldValue = field === 'status' ? r.status : r.data[field];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'starts_with':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'ends_with':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        case 'greater_equal':
          return fieldValue >= value;
        case 'less_equal':
          return fieldValue <= value;
        case 'is_empty':
          return !fieldValue || fieldValue === '';
        case 'is_not_empty':
          return fieldValue && fieldValue !== '';
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(value) && !value.includes(fieldValue);
        default:
          return true;
      }
    });
  }
  
  // Apply sorting
  for (const { field, order } of sort.reverse()) {
    const sortOrder = order === 'asc' ? 1 : -1;
    results.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (field === 'created_at') {
        aVal = a.createdAt;
        bVal = b.createdAt;
      } else if (field === 'updated_at') {
        aVal = a.updatedAt;
        bVal = b.updatedAt;
      } else {
        aVal = a.data[field];
        bVal = b.data[field];
      }
      
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });
  }
  
  // Pagination
  const limitNum = Math.min(limit, 500);
  const startIndex = (page - 1) * limitNum;
  const paginatedResults = results.slice(startIndex, startIndex + limitNum);
  
  res.json({
    records: paginatedResults,
    pagination: {
      page,
      limit: limitNum,
      total: results.length,
      totalPages: Math.ceil(results.length / limitNum),
    },
  });
});

/**
 * GET /api/data/:moduleId/stats
 * Get statistics for a module
 */
router.get('/:moduleId/stats', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const moduleId = getParam(req.params.moduleId);
  
  const module = getModuleDefinition?.(orgId, moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const records = getRecordsMap(moduleId);
  const allRecords = Array.from(records.values());
  
  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const record of allRecords) {
    statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  }
  
  // Recent activity
  const recentRecords = allRecords
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10);
  
  res.json({
    total: allRecords.length,
    statusCounts,
    recentActivity: recentRecords.map(r => ({
      id: r.id,
      status: r.status,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy,
    })),
  });
});

export default router;
