/**
 * Module Definition Types
 * Core type definitions for the meta-platform
 */

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export interface FieldConfig {
  // Common
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  
  // String fields
  maxLength?: number;
  minLength?: number;
  prefix?: string;
  suffix?: string;
  pattern?: string;
  
  // Number fields
  min?: number;
  max?: number;
  precision?: number;
  step?: number;
  
  // Date fields
  format?: string;
  minDate?: string;
  maxDate?: string;
  
  // Dropdown/Select
  options?: Array<{ value: string; label: string; color?: string; icon?: string }>;
  allowCustom?: boolean;
  
  // Barcode
  barcodeFormat?: 'code128' | 'code39' | 'ean13' | 'qr';
  autoGenerate?: boolean;
  barcodePattern?: string;
  allowScan?: boolean;
  
  // Formula
  formula?: string;
  
  // File
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  
  // Lookup
  sourceModule?: string;
  displayField?: string;
  valueField?: string;
  filters?: Record<string, any>;
  allowCreate?: boolean;
  
  // User
  roles?: string[];
  includeCurrentUser?: boolean;
  
  // Status
  statuses?: Array<{ value: string; label: string; color: string }>;
  defaultStatus?: string;
  transitions?: Record<string, string[]>;
  
  // Table
  columns?: FieldDefinition[];
  minRows?: number;
  maxRows?: number;
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowReorder?: boolean;
  
  // Signature
  meaning?: string;
  requirePassword?: boolean;
  
  // AutoNumber
  padding?: number;
  startFrom?: number;
  
  // Any additional config
  [key: string]: any;
}

export interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

export interface UIHints {
  width?: 'full' | 'half' | 'third' | 'quarter';
  section?: string;
  order?: number;
  hidden?: boolean;
  readOnly?: boolean;
  conditionalDisplay?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value?: any;
  };
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  config?: FieldConfig;
  validations?: ValidationRule[];
  uiHints?: UIHints;
}

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

export interface SectionDefinition {
  id: string;
  name: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fields: string[];  // Field IDs
  order?: number;
}

// =============================================================================
// LIST VIEW CONFIGURATION
// =============================================================================

export interface ListViewColumn {
  field: string;
  label?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: 'text' | 'date' | 'datetime' | 'number' | 'currency' | 'status' | 'user' | 'boolean';
}

export interface ListViewConfig {
  columns: ListViewColumn[];
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: Array<{
    field: string;
    type: 'text' | 'select' | 'date_range' | 'number_range' | 'boolean';
    options?: Array<{ value: string; label: string }>;
  }>;
  searchFields?: string[];
  pageSize?: number;
  allowExport?: boolean;
  allowBulkActions?: boolean;
}

// =============================================================================
// WORKFLOW DEFINITIONS
// =============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'status_change' | 'approval' | 'notification' | 'action' | 'condition' | 'wait';
  config: {
    // Status change
    fromStatus?: string[];
    toStatus?: string;
    
    // Approval
    approverRoles?: string[];
    approverUsers?: string[];
    minApprovals?: number;
    
    // Notification
    notifyRoles?: string[];
    notifyUsers?: string[];
    notifyField?: string;  // e.g., "assigned_to"
    emailTemplate?: string;
    
    // Action
    actionType?: 'update_field' | 'create_record' | 'call_api' | 'run_formula';
    actionConfig?: Record<string, any>;
    
    // Condition
    condition?: string;  // Expression like "{status} === 'approved'"
    trueBranch?: string;  // Next step ID if true
    falseBranch?: string;  // Next step ID if false
    
    // Wait
    waitDuration?: number;
    waitUnit?: 'minutes' | 'hours' | 'days';
  };
  nextStep?: string;  // Default next step ID
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger: 'on_create' | 'on_update' | 'on_status_change' | 'manual' | 'scheduled';
  triggerConfig?: {
    statusField?: string;
    cronExpression?: string;
    buttonLabel?: string;
  };
  steps: WorkflowStep[];
  enabled?: boolean;
}

// =============================================================================
// PERMISSIONS
// =============================================================================

export interface ModulePermissions {
  create?: string[];  // Roles that can create
  read?: string[];
  update?: string[];
  delete?: string[];
  export?: string[];
  import?: string[];
  fieldLevel?: Record<string, {
    read?: string[];
    update?: string[];
  }>;
}

// =============================================================================
// INTEGRATIONS
// =============================================================================

export interface ModuleIntegrations {
  barcoding?: {
    enabled: boolean;
    printField?: string;
    scanField?: string;
  };
  instruments?: {
    enabled: boolean;
    instrumentTypes?: string[];
    resultMapping?: Record<string, string>;
  };
  externalApi?: {
    enabled: boolean;
    endpoints?: Array<{
      name: string;
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      fieldMapping?: Record<string, string>;
    }>;
  };
}

// =============================================================================
// COMPLETE MODULE CONFIGURATION
// =============================================================================

export interface ModuleConfig {
  // Fields and form structure
  fields: FieldDefinition[];
  sections?: SectionDefinition[];
  
  // List view configuration
  listView?: ListViewConfig;
  
  // Workflows
  workflows?: WorkflowDefinition[];
  
  // Permissions
  permissions?: ModulePermissions;
  
  // Integrations
  integrations?: ModuleIntegrations;
  
  // Settings
  settings?: {
    allowDuplicates?: boolean;
    softDelete?: boolean;
    requireApproval?: boolean;
    enableVersioning?: boolean;
    enableComments?: boolean;
    enableAttachments?: boolean;
  };
}

// =============================================================================
// MODULE DEFINITION (Database Record)
// =============================================================================

export interface ModuleDefinition {
  id: string;
  orgId: string;
  moduleId: string;  // Unique identifier (snake_case)
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  config: ModuleConfig;
  version: number;
  publishedVersion: number;
  status: 'draft' | 'active' | 'archived';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateModuleRequest {
  moduleId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  config: ModuleConfig;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  config?: ModuleConfig;
}

export interface ModuleListResponse {
  modules: ModuleDefinition[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export interface ModuleTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  config: ModuleConfig;
  isPublic: boolean;
  createdByOrgId?: string;
  useCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// DATA TRANSFER TYPES
// =============================================================================

export interface TransferOptions {
  includeData: boolean;
  anonymize: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  fieldMapping?: Record<string, string>;
  excludeFields?: string[];
}

export interface DataTransfer {
  id: string;
  sourceOrgId: string;
  targetOrgId: string;
  transferType: 'module_definition' | 'module_data' | 'full_clone';
  moduleId?: string;
  options: TransferOptions;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  recordsTransferred: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
}

// =============================================================================
// MODULE RECORD (Data Instance)
// =============================================================================

export interface ModuleRecord {
  id: string;
  moduleId: string;
  orgId: string;
  data: Record<string, any>;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
