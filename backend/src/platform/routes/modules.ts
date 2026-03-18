/**
 * Module Definition API Routes
 * CRUD operations for module definitions (schemas)
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../../middleware/auth';
import { FIELD_TYPE_REGISTRY, getAllFieldTypes, getFieldsByCategory } from '../field-types';
import { ModuleConfig, ModuleDefinition, CreateModuleRequest, UpdateModuleRequest } from '../types';
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

// For now, using in-memory storage - will connect to PostgreSQL
const moduleDefinitions: Map<string, ModuleDefinition> = new Map();
const moduleVersions: Map<string, { version: number; config: ModuleConfig }[]> = new Map();

// Default organization for single-tenant testing
const DEFAULT_ORG_ID = 'org-default';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getOrgModules(orgId: string): ModuleDefinition[] {
  return Array.from(moduleDefinitions.values()).filter(m => m.orgId === orgId);
}

function getModuleByKey(orgId: string, moduleId: string): ModuleDefinition | undefined {
  return Array.from(moduleDefinitions.values()).find(
    m => m.orgId === orgId && m.moduleId === moduleId
  );
}

function validateModuleConfig(config: ModuleConfig): string[] {
  const errors: string[] = [];
  
  // Check fields
  if (!config.fields || !Array.isArray(config.fields)) {
    errors.push('Module must have at least one field');
    return errors;
  }

  const fieldIds = new Set<string>();
  for (const field of config.fields) {
    // Check required properties
    if (!field.id) errors.push('Field must have an id');
    if (!field.name) errors.push(`Field ${field.id || 'unknown'} must have a name`);
    if (!field.type) errors.push(`Field ${field.id || 'unknown'} must have a type`);
    
    // Check field type exists
    if (field.type && !FIELD_TYPE_REGISTRY[field.type]) {
      errors.push(`Unknown field type: ${field.type}`);
    }
    
    // Check unique field IDs
    if (field.id && fieldIds.has(field.id)) {
      errors.push(`Duplicate field id: ${field.id}`);
    }
    fieldIds.add(field.id);
  }

  // Check sections reference valid fields
  if (config.sections) {
    for (const section of config.sections) {
      for (const fieldId of section.fields) {
        if (!fieldIds.has(fieldId)) {
          errors.push(`Section ${section.id} references unknown field: ${fieldId}`);
        }
      }
    }
  }

  // Check list view columns reference valid fields
  if (config.listView?.columns) {
    for (const col of config.listView.columns) {
      if (!fieldIds.has(col.field) && !['id', 'created_at', 'updated_at', 'status'].includes(col.field)) {
        errors.push(`List view column references unknown field: ${col.field}`);
      }
    }
  }

  return errors;
}

// =============================================================================
// FIELD TYPES ENDPOINTS
// =============================================================================

/**
 * GET /api/modules/field-types
 * Get all available field types
 */
router.get('/field-types', (req: Request, res: Response) => {
  const { category } = req.query;
  
  if (category && typeof category === 'string') {
    res.json(getFieldsByCategory(category));
  } else {
    res.json({
      types: getAllFieldTypes(),
      categories: ['basic', 'advanced', 'reference', 'special'],
    });
  }
});

/**
 * GET /api/modules/field-types/:type
 * Get specific field type details
 */
router.get('/field-types/:type', (req: Request, res: Response) => {
  const fieldType = FIELD_TYPE_REGISTRY[getParam(req.params.type)];
  
  if (!fieldType) {
    return res.status(404).json({ error: 'Field type not found' });
  }
  
  res.json(fieldType);
});

// =============================================================================
// MODULE DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /api/modules/definitions
 * List all module definitions for the organization
 */
router.get('/definitions', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const { status, search } = req.query;
  
  let modules = getOrgModules(orgId);
  
  // Filter by status
  if (status && typeof status === 'string') {
    modules = modules.filter(m => m.status === status);
  }
  
  // Search by name
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    modules = modules.filter(m => 
      m.name.toLowerCase().includes(searchLower) ||
      m.moduleId.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
    total: modules.length,
  });
});

/**
 * GET /api/modules/definitions/:moduleId
 * Get a specific module definition
 */
router.get('/definitions/:moduleId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  res.json(module);
});

/**
 * POST /api/modules/definitions
 * Create a new module definition
 */
router.post('/definitions', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const body: CreateModuleRequest = req.body;
  
  // Validate required fields
  if (!body.moduleId || !body.name || !body.config) {
    return res.status(400).json({ 
      error: 'Missing required fields: moduleId, name, config' 
    });
  }
  
  // Validate moduleId format (snake_case)
  if (!/^[a-z][a-z0-9_]*$/.test(body.moduleId)) {
    return res.status(400).json({ 
      error: 'moduleId must be snake_case (lowercase letters, numbers, underscores, starting with a letter)' 
    });
  }
  
  // Check for duplicate
  if (getModuleByKey(orgId, body.moduleId)) {
    return res.status(409).json({ error: 'Module with this ID already exists' });
  }
  
  // Validate config
  const configErrors = validateModuleConfig(body.config);
  if (configErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Invalid module configuration',
      details: configErrors,
    });
  }
  
  // Create module
  const module: ModuleDefinition = {
    id: uuidv4(),
    orgId,
    moduleId: body.moduleId,
    name: body.name,
    description: body.description,
    icon: body.icon || 'folder',
    color: body.color || '#1976d2',
    config: body.config,
    version: 1,
    publishedVersion: 0,
    status: 'draft',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
  
  moduleDefinitions.set(module.id, module);
  
  res.status(201).json(module);
});

/**
 * PUT /api/modules/definitions/:moduleId
 * Update a module definition
 */
router.put('/definitions/:moduleId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const body: UpdateModuleRequest = req.body;
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  if (module.isSystem) {
    return res.status(403).json({ error: 'Cannot modify system modules' });
  }
  
  // Validate config if provided
  if (body.config) {
    const configErrors = validateModuleConfig(body.config);
    if (configErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid module configuration',
        details: configErrors,
      });
    }
  }
  
  // Save version history if config changed
  if (body.config && JSON.stringify(body.config) !== JSON.stringify(module.config)) {
    const versions = moduleVersions.get(module.id) || [];
    versions.push({ version: module.version, config: module.config });
    moduleVersions.set(module.id, versions);
    module.version += 1;
  }
  
  // Update fields
  if (body.name) module.name = body.name;
  if (body.description !== undefined) module.description = body.description;
  if (body.icon) module.icon = body.icon;
  if (body.color) module.color = body.color;
  if (body.config) module.config = body.config;
  module.updatedAt = new Date();
  module.updatedBy = userId;
  
  moduleDefinitions.set(module.id, module);
  
  res.json(module);
});

/**
 * DELETE /api/modules/definitions/:moduleId
 * Delete a module definition
 */
router.delete('/definitions/:moduleId', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  if (module.isSystem) {
    return res.status(403).json({ error: 'Cannot delete system modules' });
  }
  
  // TODO: Check if module has data, warn or prevent deletion
  
  moduleDefinitions.delete(module.id);
  moduleVersions.delete(module.id);
  
  res.json({ success: true, message: 'Module deleted' });
});

/**
 * POST /api/modules/definitions/:moduleId/publish
 * Publish a module (make it active)
 */
router.post('/definitions/:moduleId/publish', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  module.status = 'active';
  module.publishedVersion = module.version;
  module.updatedAt = new Date();
  module.updatedBy = userId;
  
  moduleDefinitions.set(module.id, module);
  
  res.json({ 
    success: true, 
    message: `Module published (version ${module.version})`,
    module,
  });
});

/**
 * GET /api/modules/definitions/:moduleId/versions
 * Get version history
 */
router.get('/definitions/:moduleId/versions', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const versions = moduleVersions.get(module.id) || [];
  
  res.json({
    currentVersion: module.version,
    publishedVersion: module.publishedVersion,
    versions: versions.map(v => ({
      version: v.version,
      fieldCount: v.config.fields.length,
    })),
  });
});

/**
 * POST /api/modules/definitions/:moduleId/revert/:version
 * Revert to a previous version
 */
router.post('/definitions/:moduleId/revert/:version', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const targetVersion = parseInt(getParam(req.params.version));
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const versions = moduleVersions.get(module.id) || [];
  const targetVersionData = versions.find(v => v.version === targetVersion);
  
  if (!targetVersionData) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  // Save current as new version
  versions.push({ version: module.version, config: module.config });
  moduleVersions.set(module.id, versions);
  
  // Revert config
  module.config = targetVersionData.config;
  module.version += 1;
  module.updatedAt = new Date();
  module.updatedBy = userId;
  
  moduleDefinitions.set(module.id, module);
  
  res.json({ 
    success: true, 
    message: `Reverted to version ${targetVersion}`,
    module,
  });
});

/**
 * POST /api/modules/definitions/:moduleId/clone
 * Clone a module definition
 */
router.post('/definitions/:moduleId/clone', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const { newModuleId, newName } = req.body;
  
  const sourceModule = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!sourceModule) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  if (!newModuleId || !newName) {
    return res.status(400).json({ error: 'newModuleId and newName are required' });
  }
  
  // Validate new moduleId
  if (!/^[a-z][a-z0-9_]*$/.test(newModuleId)) {
    return res.status(400).json({ 
      error: 'newModuleId must be snake_case' 
    });
  }
  
  // Check for duplicate
  if (getModuleByKey(orgId, newModuleId)) {
    return res.status(409).json({ error: 'Module with this ID already exists' });
  }
  
  // Clone module
  const clonedModule: ModuleDefinition = {
    id: uuidv4(),
    orgId,
    moduleId: newModuleId,
    name: newName,
    description: sourceModule.description,
    icon: sourceModule.icon,
    color: sourceModule.color,
    config: JSON.parse(JSON.stringify(sourceModule.config)), // Deep clone
    version: 1,
    publishedVersion: 0,
    status: 'draft',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
  
  moduleDefinitions.set(clonedModule.id, clonedModule);
  
  res.status(201).json(clonedModule);
});

/**
 * POST /api/modules/definitions/:moduleId/add-field
 * Quick helper to add a field to a module
 */
router.post('/definitions/:moduleId/add-field', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  const { field, sectionId, position } = req.body;
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  // Validate field
  if (!field || !field.id || !field.name || !field.type) {
    return res.status(400).json({ error: 'Field must have id, name, and type' });
  }
  
  if (!FIELD_TYPE_REGISTRY[field.type]) {
    return res.status(400).json({ error: `Unknown field type: ${field.type}` });
  }
  
  // Check for duplicate field id
  if (module.config.fields.some(f => f.id === field.id)) {
    return res.status(409).json({ error: `Field with id "${field.id}" already exists` });
  }
  
  // Save version
  const versions = moduleVersions.get(module.id) || [];
  versions.push({ version: module.version, config: module.config });
  moduleVersions.set(module.id, versions);
  
  // Add field
  if (position !== undefined && position >= 0) {
    module.config.fields.splice(position, 0, field);
  } else {
    module.config.fields.push(field);
  }
  
  // Add to section if specified
  if (sectionId && module.config.sections) {
    const section = module.config.sections.find(s => s.id === sectionId);
    if (section) {
      section.fields.push(field.id);
    }
  }
  
  module.version += 1;
  module.updatedAt = new Date();
  module.updatedBy = userId;
  
  moduleDefinitions.set(module.id, module);
  
  res.json({ 
    success: true, 
    message: 'Field added',
    field,
    moduleVersion: module.version,
  });
});

/**
 * DELETE /api/modules/definitions/:moduleId/fields/:fieldId
 * Remove a field from a module
 */
router.delete('/definitions/:moduleId/fields/:fieldId', authenticateToken, (req: AuthRequest, res: Response) => {
  const orgId = (req as any).orgId || DEFAULT_ORG_ID;
  const userId = getUserId(req);
  
  const module = getModuleByKey(orgId, getParam(req.params.moduleId));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  
  const fieldId = getParam(req.params.fieldId);
  const fieldIndex = module.config.fields.findIndex(f => f.id === fieldId);
  if (fieldIndex === -1) {
    return res.status(404).json({ error: 'Field not found' });
  }
  
  // Save version
  const versions = moduleVersions.get(module.id) || [];
  versions.push({ version: module.version, config: module.config });
  moduleVersions.set(module.id, versions);
  
  // Remove field
  module.config.fields.splice(fieldIndex, 1);
  
  // Remove from sections
  if (module.config.sections) {
    for (const section of module.config.sections) {
      section.fields = section.fields.filter(f => f !== fieldId);
    }
  }
  
  // Remove from list view columns
  if (module.config.listView?.columns) {
    module.config.listView.columns = module.config.listView.columns.filter(
      c => c.field !== fieldId
    );
  }
  
  module.version += 1;
  module.updatedAt = new Date();
  module.updatedBy = userId;
  
  moduleDefinitions.set(module.id, module);
  
  res.json({ 
    success: true, 
    message: 'Field removed',
    moduleVersion: module.version,
  });
});

export default router;
