/**
 * Field Type Registry
 * Defines all supported field types for the dynamic module system
 */

// =============================================================================
// FIELD TYPE DEFINITIONS
// =============================================================================

export interface FieldValidation {
  type: string;
  message?: string;
  value?: any;
}

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface FieldTypeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'reference' | 'special';
  // Default UI component to render
  component: string;
  // What kind of data this stores
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array' | 'object' | 'file';
  // Available validations
  validations: string[];
  // Configuration options
  configOptions: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'select';
    default?: any;
    options?: string[];
    description: string;
  }[];
  // Default configuration
  defaultConfig: Record<string, any>;
}

export const FIELD_TYPE_REGISTRY: Record<string, FieldTypeDefinition> = {
  // =========================================================================
  // BASIC FIELDS
  // =========================================================================
  
  text: {
    type: 'text',
    name: 'Text Field',
    description: 'Single line text input',
    icon: 'text_fields',
    category: 'basic',
    component: 'TextField',
    dataType: 'string',
    validations: ['required', 'minLength', 'maxLength', 'pattern', 'unique'],
    configOptions: [
      { name: 'placeholder', type: 'string', description: 'Placeholder text' },
      { name: 'maxLength', type: 'number', default: 255, description: 'Maximum length' },
      { name: 'prefix', type: 'string', description: 'Text prefix (e.g., $)' },
      { name: 'suffix', type: 'string', description: 'Text suffix (e.g., kg)' },
    ],
    defaultConfig: { maxLength: 255 },
  },

  textarea: {
    type: 'textarea',
    name: 'Text Area',
    description: 'Multi-line text input',
    icon: 'notes',
    category: 'basic',
    component: 'TextArea',
    dataType: 'string',
    validations: ['required', 'minLength', 'maxLength'],
    configOptions: [
      { name: 'placeholder', type: 'string', description: 'Placeholder text' },
      { name: 'rows', type: 'number', default: 4, description: 'Number of rows' },
      { name: 'maxLength', type: 'number', default: 5000, description: 'Maximum length' },
    ],
    defaultConfig: { rows: 4, maxLength: 5000 },
  },

  number: {
    type: 'number',
    name: 'Number Field',
    description: 'Numeric input with optional decimal',
    icon: 'pin',
    category: 'basic',
    component: 'NumberField',
    dataType: 'number',
    validations: ['required', 'min', 'max', 'precision'],
    configOptions: [
      { name: 'min', type: 'number', description: 'Minimum value' },
      { name: 'max', type: 'number', description: 'Maximum value' },
      { name: 'precision', type: 'number', default: 2, description: 'Decimal places' },
      { name: 'step', type: 'number', default: 1, description: 'Step increment' },
      { name: 'prefix', type: 'string', description: 'Prefix (e.g., $)' },
      { name: 'suffix', type: 'string', description: 'Suffix (e.g., mg/L)' },
    ],
    defaultConfig: { precision: 2 },
  },

  dropdown: {
    type: 'dropdown',
    name: 'Dropdown',
    description: 'Select from predefined options',
    icon: 'arrow_drop_down_circle',
    category: 'basic',
    component: 'Select',
    dataType: 'string',
    validations: ['required'],
    configOptions: [
      { name: 'options', type: 'array', default: [], description: 'List of options' },
      { name: 'allowCustom', type: 'boolean', default: false, description: 'Allow custom values' },
      { name: 'placeholder', type: 'string', default: 'Select...', description: 'Placeholder' },
    ],
    defaultConfig: { options: [], allowCustom: false },
  },

  multiselect: {
    type: 'multiselect',
    name: 'Multi-Select',
    description: 'Select multiple options',
    icon: 'checklist',
    category: 'basic',
    component: 'MultiSelect',
    dataType: 'array',
    validations: ['required', 'minItems', 'maxItems'],
    configOptions: [
      { name: 'options', type: 'array', default: [], description: 'List of options' },
      { name: 'maxItems', type: 'number', description: 'Maximum selections' },
    ],
    defaultConfig: { options: [] },
  },

  checkbox: {
    type: 'checkbox',
    name: 'Checkbox',
    description: 'Yes/No toggle',
    icon: 'check_box',
    category: 'basic',
    component: 'Checkbox',
    dataType: 'boolean',
    validations: ['required'],
    configOptions: [
      { name: 'label', type: 'string', description: 'Checkbox label' },
      { name: 'defaultValue', type: 'boolean', default: false, description: 'Default state' },
    ],
    defaultConfig: { defaultValue: false },
  },

  date: {
    type: 'date',
    name: 'Date',
    description: 'Date picker',
    icon: 'calendar_today',
    category: 'basic',
    component: 'DatePicker',
    dataType: 'date',
    validations: ['required', 'minDate', 'maxDate', 'notFuture', 'notPast'],
    configOptions: [
      { name: 'format', type: 'string', default: 'YYYY-MM-DD', description: 'Display format' },
      { name: 'minDate', type: 'string', description: 'Minimum date' },
      { name: 'maxDate', type: 'string', description: 'Maximum date' },
    ],
    defaultConfig: { format: 'YYYY-MM-DD' },
  },

  datetime: {
    type: 'datetime',
    name: 'Date & Time',
    description: 'Date and time picker',
    icon: 'schedule',
    category: 'basic',
    component: 'DateTimePicker',
    dataType: 'datetime',
    validations: ['required', 'minDate', 'maxDate'],
    configOptions: [
      { name: 'format', type: 'string', default: 'YYYY-MM-DD HH:mm', description: 'Display format' },
      { name: 'includeSeconds', type: 'boolean', default: false, description: 'Show seconds' },
    ],
    defaultConfig: { format: 'YYYY-MM-DD HH:mm' },
  },

  time: {
    type: 'time',
    name: 'Time',
    description: 'Time picker only',
    icon: 'access_time',
    category: 'basic',
    component: 'TimePicker',
    dataType: 'string',
    validations: ['required'],
    configOptions: [
      { name: 'format', type: 'string', default: 'HH:mm', description: 'Time format' },
      { name: 'minuteStep', type: 'number', default: 1, description: 'Minute increment' },
    ],
    defaultConfig: { format: 'HH:mm' },
  },

  // =========================================================================
  // ADVANCED FIELDS
  // =========================================================================

  barcode: {
    type: 'barcode',
    name: 'Barcode',
    description: 'Barcode with auto-generation and scanning',
    icon: 'qr_code_scanner',
    category: 'advanced',
    component: 'BarcodeField',
    dataType: 'string',
    validations: ['required', 'unique', 'pattern'],
    configOptions: [
      { name: 'format', type: 'select', default: 'code128', options: ['code128', 'code39', 'ean13', 'qr'], description: 'Barcode format' },
      { name: 'prefix', type: 'string', default: '', description: 'Auto-generate prefix' },
      { name: 'autoGenerate', type: 'boolean', default: true, description: 'Auto-generate on create' },
      { name: 'allowScan', type: 'boolean', default: true, description: 'Allow barcode scanning' },
      { name: 'pattern', type: 'string', default: '{PREFIX}-{YYMMDD}-{####}', description: 'Generation pattern' },
    ],
    defaultConfig: { format: 'code128', autoGenerate: true, allowScan: true },
  },

  formula: {
    type: 'formula',
    name: 'Formula',
    description: 'Calculated field from other fields',
    icon: 'calculate',
    category: 'advanced',
    component: 'FormulaField',
    dataType: 'number',
    validations: [],
    configOptions: [
      { name: 'formula', type: 'string', description: 'Formula expression (e.g., {weight} / {volume})' },
      { name: 'precision', type: 'number', default: 2, description: 'Decimal places' },
      { name: 'suffix', type: 'string', description: 'Unit suffix' },
    ],
    defaultConfig: { precision: 2 },
  },

  richtext: {
    type: 'richtext',
    name: 'Rich Text',
    description: 'Formatted text editor',
    icon: 'format_paint',
    category: 'advanced',
    component: 'RichTextEditor',
    dataType: 'string',
    validations: ['required', 'maxLength'],
    configOptions: [
      { name: 'toolbar', type: 'array', default: ['bold', 'italic', 'underline', 'list'], description: 'Toolbar buttons' },
      { name: 'maxLength', type: 'number', default: 50000, description: 'Maximum length' },
    ],
    defaultConfig: { toolbar: ['bold', 'italic', 'underline', 'list'] },
  },

  file: {
    type: 'file',
    name: 'File Upload',
    description: 'Upload files',
    icon: 'attach_file',
    category: 'advanced',
    component: 'FileUpload',
    dataType: 'file',
    validations: ['required', 'maxSize', 'fileTypes'],
    configOptions: [
      { name: 'accept', type: 'string', default: '*/*', description: 'Accepted file types' },
      { name: 'maxSize', type: 'number', default: 10485760, description: 'Max size in bytes (10MB)' },
      { name: 'multiple', type: 'boolean', default: false, description: 'Allow multiple files' },
      { name: 'maxFiles', type: 'number', default: 5, description: 'Maximum files if multiple' },
    ],
    defaultConfig: { accept: '*/*', maxSize: 10485760, multiple: false },
  },

  image: {
    type: 'image',
    name: 'Image',
    description: 'Upload and preview images',
    icon: 'image',
    category: 'advanced',
    component: 'ImageUpload',
    dataType: 'file',
    validations: ['required', 'maxSize'],
    configOptions: [
      { name: 'maxSize', type: 'number', default: 5242880, description: 'Max size in bytes (5MB)' },
      { name: 'aspectRatio', type: 'string', description: 'Required aspect ratio (e.g., 16:9)' },
      { name: 'maxWidth', type: 'number', description: 'Maximum width in pixels' },
      { name: 'maxHeight', type: 'number', description: 'Maximum height in pixels' },
    ],
    defaultConfig: { maxSize: 5242880 },
  },

  signature: {
    type: 'signature',
    name: 'Signature',
    description: 'Digital signature capture',
    icon: 'draw',
    category: 'advanced',
    component: 'SignatureField',
    dataType: 'object',
    validations: ['required'],
    configOptions: [
      { name: 'meaning', type: 'string', description: 'Signature meaning statement' },
      { name: 'requirePassword', type: 'boolean', default: true, description: 'Require password confirmation' },
    ],
    defaultConfig: { requirePassword: true },
  },

  table: {
    type: 'table',
    name: 'Data Table',
    description: 'Nested table of records',
    icon: 'table_chart',
    category: 'advanced',
    component: 'DataTable',
    dataType: 'array',
    validations: ['required', 'minRows', 'maxRows'],
    configOptions: [
      { name: 'columns', type: 'array', default: [], description: 'Column definitions' },
      { name: 'minRows', type: 'number', description: 'Minimum rows required' },
      { name: 'maxRows', type: 'number', description: 'Maximum rows allowed' },
      { name: 'allowAdd', type: 'boolean', default: true, description: 'Allow adding rows' },
      { name: 'allowDelete', type: 'boolean', default: true, description: 'Allow deleting rows' },
      { name: 'allowReorder', type: 'boolean', default: true, description: 'Allow reordering' },
    ],
    defaultConfig: { columns: [], allowAdd: true, allowDelete: true },
  },

  location: {
    type: 'location',
    name: 'Location',
    description: 'GPS coordinates or address',
    icon: 'location_on',
    category: 'advanced',
    component: 'LocationPicker',
    dataType: 'object',
    validations: ['required'],
    configOptions: [
      { name: 'type', type: 'select', default: 'both', options: ['coordinates', 'address', 'both'], description: 'Location type' },
      { name: 'allowCurrentLocation', type: 'boolean', default: true, description: 'Allow GPS capture' },
    ],
    defaultConfig: { type: 'both', allowCurrentLocation: true },
  },

  // =========================================================================
  // REFERENCE FIELDS
  // =========================================================================

  lookup: {
    type: 'lookup',
    name: 'Lookup',
    description: 'Reference to another module',
    icon: 'link',
    category: 'reference',
    component: 'LookupField',
    dataType: 'string',
    validations: ['required'],
    configOptions: [
      { name: 'sourceModule', type: 'string', description: 'Module to lookup from' },
      { name: 'displayField', type: 'string', description: 'Field to display' },
      { name: 'valueField', type: 'string', default: 'id', description: 'Field to store' },
      { name: 'filters', type: 'object', description: 'Filter lookup results' },
      { name: 'allowCreate', type: 'boolean', default: false, description: 'Allow creating new records' },
    ],
    defaultConfig: { valueField: 'id', allowCreate: false },
  },

  multilookup: {
    type: 'multilookup',
    name: 'Multi-Lookup',
    description: 'Reference multiple records',
    icon: 'link',
    category: 'reference',
    component: 'MultiLookupField',
    dataType: 'array',
    validations: ['required', 'minItems', 'maxItems'],
    configOptions: [
      { name: 'sourceModule', type: 'string', description: 'Module to lookup from' },
      { name: 'displayField', type: 'string', description: 'Field to display' },
      { name: 'valueField', type: 'string', default: 'id', description: 'Field to store' },
      { name: 'maxItems', type: 'number', description: 'Maximum selections' },
    ],
    defaultConfig: { valueField: 'id' },
  },

  user: {
    type: 'user',
    name: 'User',
    description: 'Select a user',
    icon: 'person',
    category: 'reference',
    component: 'UserSelect',
    dataType: 'string',
    validations: ['required'],
    configOptions: [
      { name: 'roles', type: 'array', description: 'Filter by roles' },
      { name: 'includeCurrentUser', type: 'boolean', default: true, description: 'Include current user option' },
      { name: 'multiple', type: 'boolean', default: false, description: 'Allow multiple users' },
    ],
    defaultConfig: { includeCurrentUser: true, multiple: false },
  },

  // =========================================================================
  // SPECIAL FIELDS
  // =========================================================================

  status: {
    type: 'status',
    name: 'Status',
    description: 'Workflow status field',
    icon: 'flag',
    category: 'special',
    component: 'StatusField',
    dataType: 'string',
    validations: ['required'],
    configOptions: [
      { name: 'statuses', type: 'array', default: [], description: 'Status options with colors' },
      { name: 'defaultStatus', type: 'string', description: 'Default status for new records' },
      { name: 'transitions', type: 'object', description: 'Allowed status transitions' },
    ],
    defaultConfig: {
      statuses: [
        { value: 'draft', label: 'Draft', color: '#9e9e9e' },
        { value: 'active', label: 'Active', color: '#4caf50' },
        { value: 'completed', label: 'Completed', color: '#2196f3' },
      ],
      defaultStatus: 'draft',
    },
  },

  autonumber: {
    type: 'autonumber',
    name: 'Auto Number',
    description: 'Auto-incrementing number',
    icon: 'tag',
    category: 'special',
    component: 'AutoNumberField',
    dataType: 'string',
    validations: [],
    configOptions: [
      { name: 'prefix', type: 'string', default: '', description: 'Number prefix' },
      { name: 'suffix', type: 'string', default: '', description: 'Number suffix' },
      { name: 'padding', type: 'number', default: 5, description: 'Zero padding' },
      { name: 'startFrom', type: 'number', default: 1, description: 'Starting number' },
    ],
    defaultConfig: { prefix: '', padding: 5, startFrom: 1 },
  },

  created_at: {
    type: 'created_at',
    name: 'Created Date',
    description: 'Auto-set creation timestamp',
    icon: 'event',
    category: 'special',
    component: 'ReadOnlyDateTime',
    dataType: 'datetime',
    validations: [],
    configOptions: [
      { name: 'format', type: 'string', default: 'YYYY-MM-DD HH:mm', description: 'Display format' },
    ],
    defaultConfig: { format: 'YYYY-MM-DD HH:mm' },
  },

  updated_at: {
    type: 'updated_at',
    name: 'Updated Date',
    description: 'Auto-set update timestamp',
    icon: 'update',
    category: 'special',
    component: 'ReadOnlyDateTime',
    dataType: 'datetime',
    validations: [],
    configOptions: [
      { name: 'format', type: 'string', default: 'YYYY-MM-DD HH:mm', description: 'Display format' },
    ],
    defaultConfig: { format: 'YYYY-MM-DD HH:mm' },
  },

  created_by: {
    type: 'created_by',
    name: 'Created By',
    description: 'Auto-set creator',
    icon: 'person_add',
    category: 'special',
    component: 'ReadOnlyUser',
    dataType: 'string',
    validations: [],
    configOptions: [],
    defaultConfig: {},
  },

  updated_by: {
    type: 'updated_by',
    name: 'Updated By',
    description: 'Auto-set last updater',
    icon: 'person',
    category: 'special',
    component: 'ReadOnlyUser',
    dataType: 'string',
    validations: [],
    configOptions: [],
    defaultConfig: {},
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getFieldType(type: string): FieldTypeDefinition | undefined {
  return FIELD_TYPE_REGISTRY[type];
}

export function getFieldsByCategory(category: string): FieldTypeDefinition[] {
  return Object.values(FIELD_TYPE_REGISTRY).filter(f => f.category === category);
}

export function getAllFieldTypes(): FieldTypeDefinition[] {
  return Object.values(FIELD_TYPE_REGISTRY);
}

export function getFieldTypeCategories(): string[] {
  return ['basic', 'advanced', 'reference', 'special'];
}

export default FIELD_TYPE_REGISTRY;
