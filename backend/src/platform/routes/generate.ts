/**
 * AI Generation API Routes
 * Endpoints for AI-powered module generation
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { generateModule, suggestFields, generateWorkflows } from '../ai/module-generator';
import { LAB_TYPES, getLabTypeCategories, getLabTypesByCategory, findLabType } from '../ai/knowledge-base';

const router = Router();

// Helper to get param as string
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// =============================================================================
// LAB TYPES ENDPOINTS (Knowledge Base)
// =============================================================================

/**
 * GET /api/generate/lab-types
 * List all available lab types
 */
router.get('/lab-types', (req: Request, res: Response) => {
  const labTypes = Object.values(LAB_TYPES).map(lt => ({
    id: lt.id,
    name: lt.name,
    description: lt.description,
    category: lt.category,
    keywords: lt.keywords,
    regulations: lt.regulations
  }));
  
  res.json({
    labTypes,
    categories: getLabTypeCategories(),
    total: labTypes.length
  });
});

/**
 * GET /api/generate/lab-types/:id
 * Get detailed information about a specific lab type
 */
router.get('/lab-types/:id', (req: Request, res: Response) => {
  const labTypeId = getParam(req.params.id);
  const labType = LAB_TYPES[labTypeId];
  
  if (!labType) {
    return res.status(404).json({ error: 'Lab type not found' });
  }
  
  res.json(labType);
});

/**
 * GET /api/generate/lab-types/category/:category
 * Get lab types by category
 */
router.get('/lab-types/category/:category', (req: Request, res: Response) => {
  const category = getParam(req.params.category);
  const labTypes = getLabTypesByCategory(category);
  res.json({ labTypes });
});

/**
 * POST /api/generate/lab-types/match
 * Find matching lab type from description
 */
router.post('/lab-types/match', (req: Request, res: Response) => {
  const { description } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }
  
  const match = findLabType(description);
  
  if (match) {
    res.json({
      matched: true,
      labType: {
        id: match.id,
        name: match.name,
        description: match.description,
        category: match.category
      }
    });
  } else {
    res.json({
      matched: false,
      message: 'No matching lab type found. AI will generate a custom module.'
    });
  }
});

// =============================================================================
// MODULE GENERATION ENDPOINTS
// =============================================================================

/**
 * POST /api/generate/module
 * Generate a complete module configuration from natural language
 */
router.post('/module', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { prompt, labType, includeWorkflows, maxFields } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  
  if (prompt.length < 10) {
    return res.status(400).json({ error: 'Please provide a more detailed description (at least 10 characters)' });
  }
  
  try {
    const result = await generateModule({
      prompt,
      labType,
      includeWorkflows: includeWorkflows !== false,
      maxFields: maxFields || 20
    });
    
    if (result.success) {
      res.json({
        success: true,
        module: {
          meta: result.moduleMeta,
          config: result.moduleConfig
        },
        matchedLabType: result.matchedLabType ? {
          id: result.matchedLabType.id,
          name: result.matchedLabType.name
        } : null,
        explanation: result.aiExplanation
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Module generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Module generation failed'
    });
  }
});

/**
 * POST /api/generate/module/preview
 * Preview what a module would look like without saving
 */
router.post('/module/preview', async (req: Request, res: Response) => {
  const { prompt, labType } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  
  // Check for matching lab type first (no AI call needed)
  const match = labType ? LAB_TYPES[labType] : findLabType(prompt);
  
  if (match) {
    res.json({
      preview: {
        suggestedName: match.name,
        description: match.description,
        fieldCount: match.suggestedFields.length,
        workflowCount: match.suggestedWorkflows.length,
        sampleFields: match.suggestedFields.slice(0, 5).map(f => ({
          name: f.name,
          type: f.type
        })),
        regulations: match.regulations
      },
      matchedLabType: {
        id: match.id,
        name: match.name
      },
      message: 'Preview based on knowledge base. Full generation will enhance with AI.'
    });
  } else {
    res.json({
      preview: null,
      matchedLabType: null,
      message: 'No matching lab type in knowledge base. Full generation will use AI to create a custom module.'
    });
  }
});

// =============================================================================
// FIELD SUGGESTION ENDPOINTS
// =============================================================================

/**
 * POST /api/generate/fields
 * Suggest additional fields for a module
 */
router.post('/fields', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { moduleName, moduleDescription, existingFields, context } = req.body;
  
  if (!moduleName) {
    return res.status(400).json({ error: 'moduleName is required' });
  }
  
  try {
    const fields = await suggestFields({
      moduleName,
      moduleDescription: moduleDescription || '',
      existingFields: existingFields || [],
      context
    });
    
    res.json({
      success: true,
      suggestedFields: fields,
      count: fields.length
    });
  } catch (error: any) {
    console.error('Field suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Field suggestion failed'
    });
  }
});

/**
 * POST /api/generate/fields/for-lab-type
 * Get all suggested fields for a specific lab type
 */
router.post('/fields/for-lab-type', (req: Request, res: Response) => {
  const { labType, category } = req.body;
  
  let fields: any[] = [];
  
  if (labType && LAB_TYPES[labType]) {
    fields = LAB_TYPES[labType].suggestedFields;
  } else if (category) {
    // Merge fields from all lab types in category
    const labTypes = getLabTypesByCategory(category);
    const fieldMap = new Map();
    
    for (const lt of labTypes) {
      for (const field of lt.suggestedFields) {
        if (!fieldMap.has(field.id)) {
          fieldMap.set(field.id, field);
        }
      }
    }
    
    fields = Array.from(fieldMap.values());
  }
  
  res.json({
    fields,
    count: fields.length
  });
});

// =============================================================================
// WORKFLOW GENERATION ENDPOINTS
// =============================================================================

/**
 * POST /api/generate/workflows
 * Generate workflows for a module
 */
router.post('/workflows', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { moduleName, moduleDescription, fields, context } = req.body;
  
  if (!moduleName || !fields) {
    return res.status(400).json({ error: 'moduleName and fields are required' });
  }
  
  try {
    const workflows = await generateWorkflows({
      moduleName,
      moduleDescription: moduleDescription || '',
      fields,
      context
    });
    
    res.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error: any) {
    console.error('Workflow generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Workflow generation failed'
    });
  }
});

/**
 * POST /api/generate/workflows/for-lab-type
 * Get suggested workflows for a lab type
 */
router.post('/workflows/for-lab-type', (req: Request, res: Response) => {
  const { labType } = req.body;
  
  if (!labType || !LAB_TYPES[labType]) {
    return res.status(400).json({ error: 'Valid labType is required' });
  }
  
  const workflows = LAB_TYPES[labType].suggestedWorkflows;
  
  res.json({
    workflows,
    count: workflows.length
  });
});

// =============================================================================
// QUICK GENERATION ENDPOINTS
// =============================================================================

/**
 * POST /api/generate/quick
 * Quick generation using only knowledge base (no AI call)
 */
router.post('/quick', authenticateToken, (req: AuthRequest, res: Response) => {
  const { prompt, labType } = req.body;
  
  if (!prompt && !labType) {
    return res.status(400).json({ error: 'prompt or labType is required' });
  }
  
  const match = labType ? LAB_TYPES[labType] : findLabType(prompt);
  
  if (!match) {
    return res.status(400).json({ 
      error: 'No matching lab type found. Use /generate/module for AI-powered custom generation.',
      availableLabTypes: Object.keys(LAB_TYPES)
    });
  }
  
  // Generate module config from knowledge base
  const config = {
    fields: match.suggestedFields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      description: f.description,
      required: f.required,
      config: f.config
    })),
    sections: [
      { id: 'basic', name: 'Basic Information', fields: match.suggestedFields.slice(0, 5).map(f => f.id) },
      { id: 'details', name: 'Details', fields: match.suggestedFields.slice(5, 10).map(f => f.id) },
      { id: 'results', name: 'Results & Status', fields: match.suggestedFields.slice(10).map(f => f.id) }
    ],
    workflows: match.suggestedWorkflows.map((w, i) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger: w.trigger,
      steps: w.steps.map((step, j) => ({
        id: `step_${j + 1}`,
        name: step,
        type: 'action',
        config: {}
      })),
      enabled: true
    })),
    listView: {
      columns: match.suggestedFields.slice(0, 6).map(f => ({
        field: f.id,
        label: f.name,
        sortable: true,
        filterable: true
      })),
      defaultSort: { field: 'created_at', direction: 'desc' },
      pageSize: 25
    }
  };
  
  res.json({
    success: true,
    module: {
      meta: {
        suggestedId: match.id,
        suggestedName: match.name,
        description: match.description,
        icon: 'science',
        color: '#1976d2'
      },
      config
    },
    labType: {
      id: match.id,
      name: match.name
    },
    source: 'knowledge_base'
  });
});

export default router;
