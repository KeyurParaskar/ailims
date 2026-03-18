/**
 * AI Module Generator Service
 * Uses OpenAI to generate complete module configurations from natural language
 */

import OpenAI from 'openai';
import { 
  LAB_TYPES, 
  findLabType, 
  suggestFieldType, 
  FIELD_PATTERNS, 
  WORKFLOW_PATTERNS,
  LabTypeDefinition,
  FieldSuggestion
} from './knowledge-base';
import { 
  ModuleConfig, 
  FieldDefinition, 
  SectionDefinition, 
  WorkflowDefinition,
  ListViewConfig 
} from '../types';
import { FIELD_TYPE_REGISTRY, getAllFieldTypes } from '../field-types';

// =============================================================================
// TYPES
// =============================================================================

export interface GenerationRequest {
  prompt: string;
  labType?: string;
  includeWorkflows?: boolean;
  maxFields?: number;
}

export interface GenerationResult {
  success: boolean;
  moduleConfig?: ModuleConfig;
  moduleMeta?: {
    suggestedId: string;
    suggestedName: string;
    description: string;
    icon: string;
    color: string;
  };
  matchedLabType?: LabTypeDefinition;
  aiExplanation?: string;
  error?: string;
}

export interface FieldGenerationRequest {
  moduleName: string;
  moduleDescription: string;
  existingFields: string[];
  context?: string;
}

export interface WorkflowGenerationRequest {
  moduleName: string;
  moduleDescription: string;
  fields: FieldDefinition[];
  context?: string;
}

// =============================================================================
// OPENAI CLIENT
// =============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

const FIELD_TYPES_SUMMARY = `Available field types:
- text: Single line text
- textarea: Multi-line text
- richtext: Formatted text with HTML
- number: Numeric values (config: min, max, precision, suffix)
- date: Date picker
- datetime: Date and time
- time: Time only
- boolean: Yes/No checkbox
- dropdown: Single select from options
- multiselect: Multiple select
- barcode: Barcode with scanner support (config: barcodeFormat, autoGenerate)
- autonumber: Auto-incrementing ID (config: pattern like 'SAM-{YYYY}-{0000}')
- formula: Calculated field (config: formula)
- lookup: Reference to another module
- user: User picker (config: roles)
- status: Status with colors and transitions
- table: Inline table/grid
- signature: Electronic signature (config: requirePassword, meaning)
- file: File attachment
- image: Image upload
- location: GPS coordinates or address
- rating: Star rating`;

const MODULE_GENERATOR_SYSTEM_PROMPT = `You are an expert Laboratory Information Management System (LIMS) architect. 
Your task is to design module configurations for laboratory workflows.

${FIELD_TYPES_SUMMARY}

When designing a module, consider:
1. Required fields for compliance and traceability
2. Logical field ordering and sections
3. Appropriate field types for each data element
4. Status workflows typical for the lab type
5. Industry best practices and regulations

Output must be valid JSON matching the ModuleConfig schema.`;

const FIELD_SUGGESTION_PROMPT = `You are an expert LIMS architect. Suggest additional fields for a laboratory module.

${FIELD_TYPES_SUMMARY}

Output a JSON array of field definitions. Each field should have:
- id: snake_case identifier
- name: Human readable name
- type: One of the available field types
- description: Brief explanation
- required: boolean (optional)
- config: type-specific configuration (optional)`;

// =============================================================================
// MODULE GENERATOR
// =============================================================================

export async function generateModule(request: GenerationRequest): Promise<GenerationResult> {
  const { prompt, labType: requestedLabType, includeWorkflows = true, maxFields = 20 } = request;
  
  try {
    // Step 1: Find matching lab type from knowledge base
    const foundLabType = requestedLabType 
      ? LAB_TYPES[requestedLabType] 
      : findLabType(prompt);
    const matchedLabType = foundLabType || undefined;
    
    // Step 2: Build the generation prompt
    let contextPrompt = prompt;
    let baseFields: FieldSuggestion[] = [];
    
    if (matchedLabType) {
      contextPrompt = `Lab Type: ${matchedLabType.name}
Description: ${matchedLabType.description}
Category: ${matchedLabType.category}
Relevant Regulations: ${matchedLabType.regulations?.join(', ') || 'None specified'}

User's specific request: ${prompt}

Use the suggested fields as a starting point, but customize based on the user's request.`;
      
      baseFields = matchedLabType.suggestedFields;
    }
    
    // Step 3: Call OpenAI for enhanced generation
    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: MODULE_GENERATOR_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a LIMS module configuration for the following:

${contextPrompt}

${baseFields.length > 0 ? `
Suggested base fields from knowledge base:
${JSON.stringify(baseFields.slice(0, 10), null, 2)}
` : ''}

Requirements:
1. Generate ${maxFields} most relevant fields maximum
2. Include appropriate sections (e.g., "Basic Information", "Testing", "Results", etc.)
3. ${includeWorkflows ? 'Include 2-3 relevant workflows' : 'Do not include workflows'}
4. Include a list view configuration with key columns
5. Add appropriate status field with lab-specific statuses

Respond with a JSON object containing:
{
  "moduleMeta": {
    "suggestedId": "snake_case_module_id",
    "suggestedName": "Human Readable Name",
    "description": "Module description",
    "icon": "material icon name",
    "color": "#hex color"
  },
  "config": {
    // Full ModuleConfig object
  },
  "explanation": "Brief explanation of design decisions"
}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }
    
    const aiResponse = JSON.parse(responseText);
    
    // Step 4: Validate and enhance the response
    const moduleConfig = validateAndEnhanceConfig(aiResponse.config);
    
    return {
      success: true,
      moduleConfig,
      moduleMeta: aiResponse.moduleMeta,
      matchedLabType,
      aiExplanation: aiResponse.explanation
    };
    
  } catch (error: any) {
    console.error('Module generation error:', error);
    
    // Fallback: Generate from knowledge base only if AI fails
    const matchedLabType = findLabType(prompt);
    if (matchedLabType) {
      return {
        success: true,
        moduleConfig: generateFromKnowledgeBase(matchedLabType),
        moduleMeta: {
          suggestedId: matchedLabType.id,
          suggestedName: matchedLabType.name,
          description: matchedLabType.description,
          icon: 'science',
          color: '#1976d2'
        },
        matchedLabType,
        aiExplanation: 'Generated from knowledge base (AI unavailable)'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Module generation failed'
    };
  }
}

// =============================================================================
// FIELD SUGGESTION ENGINE
// =============================================================================

export async function suggestFields(request: FieldGenerationRequest): Promise<FieldDefinition[]> {
  const { moduleName, moduleDescription, existingFields, context } = request;
  
  try {
    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FIELD_SUGGESTION_PROMPT },
        { role: 'user', content: `Module: ${moduleName}
Description: ${moduleDescription}
${context ? `Context: ${context}` : ''}

Existing fields: ${existingFields.join(', ')}

Suggest 5-10 additional fields that would be useful for this module.
Do not duplicate existing fields.
Consider compliance requirements, data integrity, and usability.

Respond with a JSON object: { "fields": [...] }` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];
    
    const response = JSON.parse(responseText);
    return validateFields(response.fields || []);
    
  } catch (error) {
    console.error('Field suggestion error:', error);
    return suggestFieldsFromPatterns(moduleName, existingFields);
  }
}

// =============================================================================
// WORKFLOW GENERATOR
// =============================================================================

export async function generateWorkflows(request: WorkflowGenerationRequest): Promise<WorkflowDefinition[]> {
  const { moduleName, moduleDescription, fields, context } = request;
  
  try {
    const openai = getOpenAI();
    
    const fieldNames = fields.map(f => f.name).join(', ');
    const hasStatus = fields.some(f => f.type === 'status');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a LIMS workflow expert. Design workflows for laboratory modules.

Available triggers:
- on_create: When record is created
- on_update: When record is updated
- on_status_change: When status field changes
- manual: User-triggered
- scheduled: Time-based

Step types:
- status_change: Change status
- notification: Send alert
- approval: Require approval
- action: Run action
- condition: Branch logic` },
        { role: 'user', content: `Module: ${moduleName}
Description: ${moduleDescription}
Fields: ${fieldNames}
${hasStatus ? 'Has status field: Yes' : 'No status field'}
${context ? `Context: ${context}` : ''}

Design 2-3 practical workflows for this module.

Respond with: { "workflows": [...] }` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];
    
    const response = JSON.parse(responseText);
    return validateWorkflows(response.workflows || []);
    
  } catch (error) {
    console.error('Workflow generation error:', error);
    return generateDefaultWorkflows(moduleName);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function validateAndEnhanceConfig(config: any): ModuleConfig {
  if (!config) {
    throw new Error('No config provided');
  }
  
  // Ensure fields array exists
  if (!config.fields || !Array.isArray(config.fields)) {
    config.fields = [];
  }
  
  // Validate each field
  config.fields = validateFields(config.fields);
  
  // Ensure we have at least a status field
  if (!config.fields.some((f: any) => f.type === 'status')) {
    config.fields.push({
      id: 'status',
      name: 'Status',
      type: 'status',
      config: {
        statuses: [
          { value: 'draft', label: 'Draft', color: '#9e9e9e' },
          { value: 'in_progress', label: 'In Progress', color: '#2196f3' },
          { value: 'completed', label: 'Completed', color: '#4caf50' }
        ]
      }
    });
  }
  
  // Validate sections
  if (config.sections) {
    config.sections = validateSections(config.sections, config.fields);
  }
  
  // Validate list view
  if (config.listView) {
    config.listView = validateListView(config.listView, config.fields);
  } else {
    // Generate default list view
    config.listView = generateDefaultListView(config.fields);
  }
  
  // Validate workflows
  if (config.workflows) {
    config.workflows = validateWorkflows(config.workflows);
  }
  
  return config as ModuleConfig;
}

function validateFields(fields: any[]): FieldDefinition[] {
  return fields
    .filter(f => f && f.id && f.name && f.type)
    .map(f => {
      // Validate field type exists
      if (!FIELD_TYPE_REGISTRY[f.type]) {
        // Try to infer correct type
        const suggested = suggestFieldType(f.id);
        if (suggested) {
          f.type = suggested.type;
          f.config = { ...suggested.config, ...f.config };
        } else {
          f.type = 'text'; // Default fallback
        }
      }
      
      return {
        id: f.id.toLowerCase().replace(/\s+/g, '_'),
        name: f.name,
        type: f.type,
        description: f.description,
        required: f.required || false,
        config: f.config,
        validations: f.validations,
        uiHints: f.uiHints
      };
    });
}

function validateSections(sections: any[], fields: FieldDefinition[]): SectionDefinition[] {
  const fieldIds = new Set(fields.map(f => f.id));
  
  return sections
    .filter(s => s && s.id && s.name)
    .map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      collapsible: s.collapsible ?? true,
      defaultCollapsed: s.defaultCollapsed ?? false,
      fields: (s.fields || []).filter((fid: string) => fieldIds.has(fid)),
      order: s.order
    }));
}

function validateListView(listView: any, fields: FieldDefinition[]): ListViewConfig {
  const fieldIds = new Set(fields.map(f => f.id));
  
  return {
    columns: (listView.columns || [])
      .filter((c: any) => c.field && (fieldIds.has(c.field) || ['id', 'created_at', 'updated_at'].includes(c.field)))
      .map((c: any) => ({
        field: c.field,
        label: c.label,
        width: c.width,
        sortable: c.sortable ?? true,
        filterable: c.filterable ?? true
      })),
    defaultSort: listView.defaultSort,
    searchFields: listView.searchFields || fields.filter(f => f.type === 'text').map(f => f.id).slice(0, 5),
    pageSize: listView.pageSize || 25
  };
}

function validateWorkflows(workflows: any[]): WorkflowDefinition[] {
  return workflows
    .filter(w => w && w.id && w.name)
    .map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger: w.trigger || 'manual',
      triggerConfig: w.triggerConfig,
      steps: (w.steps || []).map((s: any, index: number) => ({
        id: s.id || `step_${index + 1}`,
        name: s.name || `Step ${index + 1}`,
        type: s.type || 'action',
        config: s.config || {},
        nextStep: s.nextStep
      })),
      enabled: w.enabled ?? true
    }));
}

function generateDefaultListView(fields: FieldDefinition[]): ListViewConfig {
  // Pick key fields for list view
  const keyFields = fields.filter(f => 
    f.required || 
    f.type === 'barcode' || 
    f.type === 'autonumber' ||
    f.type === 'status' ||
    f.id.includes('name') ||
    f.id.includes('id')
  ).slice(0, 6);
  
  return {
    columns: keyFields.map(f => ({
      field: f.id,
      label: f.name,
      sortable: true,
      filterable: true
    })),
    defaultSort: {
      field: 'created_at',
      direction: 'desc'
    },
    searchFields: fields.filter(f => f.type === 'text').map(f => f.id).slice(0, 5),
    pageSize: 25
  };
}

function generateFromKnowledgeBase(labType: LabTypeDefinition): ModuleConfig {
  const fields: FieldDefinition[] = labType.suggestedFields.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    description: f.description,
    required: f.required,
    config: f.config
  }));
  
  const workflows: WorkflowDefinition[] = labType.suggestedWorkflows.map((w, i) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    trigger: w.trigger as any,
    steps: w.steps.map((step, j) => ({
      id: `step_${j + 1}`,
      name: step,
      type: 'action' as const,
      config: {}
    })),
    enabled: true
  }));
  
  return {
    fields,
    sections: [
      { id: 'basic', name: 'Basic Information', fields: fields.slice(0, 5).map(f => f.id) },
      { id: 'details', name: 'Details', fields: fields.slice(5, 10).map(f => f.id) },
      { id: 'results', name: 'Results & Status', fields: fields.slice(10).map(f => f.id) }
    ],
    listView: generateDefaultListView(fields),
    workflows
  };
}

function suggestFieldsFromPatterns(moduleName: string, existingFields: string[]): FieldDefinition[] {
  const suggestions: FieldDefinition[] = [];
  const existingSet = new Set(existingFields.map(f => f.toLowerCase()));
  
  // Common fields for any module
  const commonFields = [
    { id: 'notes', name: 'Notes', type: 'textarea', description: 'Additional notes' },
    { id: 'created_by', name: 'Created By', type: 'user', description: 'User who created the record' },
    { id: 'attachments', name: 'Attachments', type: 'file', description: 'File attachments', config: { multiple: true } }
  ];
  
  for (const field of commonFields) {
    if (!existingSet.has(field.id)) {
      suggestions.push(field as FieldDefinition);
    }
  }
  
  return suggestions;
}

function generateDefaultWorkflows(moduleName: string): WorkflowDefinition[] {
  return [
    {
      id: 'intake',
      name: `${moduleName} Intake`,
      description: 'Initial record creation workflow',
      trigger: 'on_create',
      steps: [
        { id: 'step_1', name: 'Assign ID', type: 'action', config: {} },
        { id: 'step_2', name: 'Set Initial Status', type: 'status_change', config: { toStatus: 'draft' } },
        { id: 'step_3', name: 'Notify Assignee', type: 'notification', config: {} }
      ],
      enabled: true
    },
    {
      id: 'completion',
      name: `${moduleName} Completion`,
      description: 'Mark as complete workflow',
      trigger: 'on_status_change',
      steps: [
        { id: 'step_1', name: 'Validate Required Fields', type: 'condition', config: {} },
        { id: 'step_2', name: 'Update Status', type: 'status_change', config: { toStatus: 'completed' } }
      ],
      enabled: true
    }
  ];
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  generateModule,
  suggestFields,
  generateWorkflows
};
