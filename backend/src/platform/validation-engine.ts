/**
 * Validation Engine
 * Validates field values based on field type and configuration
 */

import { FIELD_TYPE_REGISTRY } from './field-types';

// =============================================================================
// TYPES
// =============================================================================

export interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  config?: Record<string, any>;
  validations?: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  fieldName: string;
  rule: string;
  message: string;
  value?: any;
}

// =============================================================================
// VALIDATION FUNCTIONS BY TYPE
// =============================================================================

const validators: Record<string, (value: any, rule: ValidationRule, field: FieldDefinition, allData: Record<string, any>) => string | null> = {
  
  // Required validation
  required: (value, rule, field) => {
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return rule.message || `${field.name} is required`;
    }
    return null;
  },

  // String validations
  minLength: (value, rule, field) => {
    if (typeof value === 'string' && value.length < rule.value) {
      return rule.message || `${field.name} must be at least ${rule.value} characters`;
    }
    return null;
  },

  maxLength: (value, rule, field) => {
    if (typeof value === 'string' && value.length > rule.value) {
      return rule.message || `${field.name} must be no more than ${rule.value} characters`;
    }
    return null;
  },

  pattern: (value, rule, field) => {
    if (typeof value === 'string' && value.length > 0) {
      const regex = new RegExp(rule.value);
      if (!regex.test(value)) {
        return rule.message || `${field.name} format is invalid`;
      }
    }
    return null;
  },

  // Number validations
  min: (value, rule, field) => {
    if (typeof value === 'number' && value < rule.value) {
      return rule.message || `${field.name} must be at least ${rule.value}`;
    }
    return null;
  },

  max: (value, rule, field) => {
    if (typeof value === 'number' && value > rule.value) {
      return rule.message || `${field.name} must be no more than ${rule.value}`;
    }
    return null;
  },

  precision: (value, rule, field) => {
    if (typeof value === 'number') {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > rule.value) {
        return rule.message || `${field.name} can have at most ${rule.value} decimal places`;
      }
    }
    return null;
  },

  // Date validations
  minDate: (value, rule, field) => {
    if (value) {
      const date = new Date(value);
      const minDate = new Date(rule.value);
      if (date < minDate) {
        return rule.message || `${field.name} must be on or after ${rule.value}`;
      }
    }
    return null;
  },

  maxDate: (value, rule, field) => {
    if (value) {
      const date = new Date(value);
      const maxDate = new Date(rule.value);
      if (date > maxDate) {
        return rule.message || `${field.name} must be on or before ${rule.value}`;
      }
    }
    return null;
  },

  notFuture: (value, rule, field) => {
    if (value) {
      const date = new Date(value);
      if (date > new Date()) {
        return rule.message || `${field.name} cannot be in the future`;
      }
    }
    return null;
  },

  notPast: (value, rule, field) => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return rule.message || `${field.name} cannot be in the past`;
      }
    }
    return null;
  },

  // Array validations
  minItems: (value, rule, field) => {
    if (Array.isArray(value) && value.length < rule.value) {
      return rule.message || `${field.name} must have at least ${rule.value} items`;
    }
    return null;
  },

  maxItems: (value, rule, field) => {
    if (Array.isArray(value) && value.length > rule.value) {
      return rule.message || `${field.name} can have at most ${rule.value} items`;
    }
    return null;
  },

  // File validations
  maxSize: (value, rule, field) => {
    if (value && value.size && value.size > rule.value) {
      const maxMB = (rule.value / 1024 / 1024).toFixed(1);
      return rule.message || `${field.name} must be smaller than ${maxMB}MB`;
    }
    return null;
  },

  fileTypes: (value, rule, field) => {
    if (value && value.type) {
      const allowedTypes = rule.value as string[];
      if (!allowedTypes.some(t => value.type.match(new RegExp(t.replace('*', '.*'))))) {
        return rule.message || `${field.name} must be one of: ${allowedTypes.join(', ')}`;
      }
    }
    return null;
  },

  // Email validation
  email: (value, rule, field) => {
    if (typeof value === 'string' && value.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return rule.message || `${field.name} must be a valid email address`;
      }
    }
    return null;
  },

  // URL validation
  url: (value, rule, field) => {
    if (typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
      } catch {
        return rule.message || `${field.name} must be a valid URL`;
      }
    }
    return null;
  },

  // Custom function validation (for formula-based rules)
  custom: (value, rule, field, allData) => {
    try {
      // rule.value should be a function string like "({value, data}) => value > data.min_amount"
      const fn = new Function('context', `return (${rule.value})(context)`);
      const isValid = fn({ value, data: allData, field });
      if (!isValid) {
        return rule.message || `${field.name} validation failed`;
      }
    } catch (error) {
      console.error(`Custom validation error for ${field.id}:`, error);
      return `Validation error for ${field.name}`;
    }
    return null;
  },

  // Unique validation (needs to be implemented with database check)
  unique: (value, rule, field) => {
    // This is a placeholder - actual uniqueness check happens at the service level
    // The validator just marks it should be checked
    return null;
  },
};

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate a single field value
 */
export function validateField(
  value: any,
  field: FieldDefinition,
  allData: Record<string, any> = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Get field type definition
  const fieldType = FIELD_TYPE_REGISTRY[field.type];
  
  // Required check (applies to all fields)
  if (field.required) {
    const error = validators.required(value, { type: 'required' }, field, allData);
    if (error) {
      errors.push({
        field: field.id,
        fieldName: field.name,
        rule: 'required',
        message: error,
        value,
      });
      // If required fails and value is empty, skip other validations
      if (value === undefined || value === null || value === '') {
        return errors;
      }
    }
  }

  // Skip other validations if value is empty (and not required, or required already caught)
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Run field-specific validations from config
  if (field.validations) {
    for (const rule of field.validations) {
      const validator = validators[rule.type];
      if (validator) {
        const error = validator(value, rule, field, allData);
        if (error) {
          errors.push({
            field: field.id,
            fieldName: field.name,
            rule: rule.type,
            message: error,
            value,
          });
        }
      }
    }
  }

  // Run config-based validations (e.g., maxLength from field config)
  if (field.config) {
    const config = field.config;
    
    // String length from config
    if (config.maxLength && typeof value === 'string') {
      if (value.length > config.maxLength) {
        errors.push({
          field: field.id,
          fieldName: field.name,
          rule: 'maxLength',
          message: `${field.name} must be no more than ${config.maxLength} characters`,
          value,
        });
      }
    }

    // Number range from config
    if (config.min !== undefined && typeof value === 'number') {
      if (value < config.min) {
        errors.push({
          field: field.id,
          fieldName: field.name,
          rule: 'min',
          message: `${field.name} must be at least ${config.min}`,
          value,
        });
      }
    }
    if (config.max !== undefined && typeof value === 'number') {
      if (value > config.max) {
        errors.push({
          field: field.id,
          fieldName: field.name,
          rule: 'max',
          message: `${field.name} must be no more than ${config.max}`,
          value,
        });
      }
    }

    // Dropdown options validation
    if (config.options && Array.isArray(config.options) && !config.allowCustom) {
      const validValues = config.options.map((o: any) => typeof o === 'string' ? o : o.value);
      if (!validValues.includes(value)) {
        errors.push({
          field: field.id,
          fieldName: field.name,
          rule: 'options',
          message: `${field.name} must be one of the allowed values`,
          value,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate all fields in a module
 */
export function validateModuleData(
  data: Record<string, any>,
  fields: FieldDefinition[]
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const value = data[field.id];
    const fieldErrors = validateField(value, field, data);
    errors.push(...fieldErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get validation schema for a field (for frontend)
 */
export function getValidationSchema(field: FieldDefinition): Record<string, any> {
  const schema: Record<string, any> = {};

  if (field.required) {
    schema.required = true;
  }

  if (field.config) {
    if (field.config.maxLength) schema.maxLength = field.config.maxLength;
    if (field.config.min !== undefined) schema.min = field.config.min;
    if (field.config.max !== undefined) schema.max = field.config.max;
    if (field.config.pattern) schema.pattern = field.config.pattern;
  }

  if (field.validations) {
    for (const rule of field.validations) {
      schema[rule.type] = rule.value ?? true;
    }
  }

  return schema;
}

// =============================================================================
// FORMULA PARSER
// =============================================================================

/**
 * Parse and evaluate a formula expression
 * Supports: {field_id} references, basic math, common functions
 */
export function evaluateFormula(
  formula: string,
  data: Record<string, any>
): number | null {
  try {
    // Replace field references with values
    let expression = formula.replace(/\{([^}]+)\}/g, (match, fieldId) => {
      const value = data[fieldId];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing value for field: ${fieldId}`);
      }
      return String(value);
    });

    // Support common functions
    expression = expression
      .replace(/ROUND\(/gi, 'Math.round(')
      .replace(/FLOOR\(/gi, 'Math.floor(')
      .replace(/CEIL\(/gi, 'Math.ceil(')
      .replace(/ABS\(/gi, 'Math.abs(')
      .replace(/SQRT\(/gi, 'Math.sqrt(')
      .replace(/POW\(/gi, 'Math.pow(')
      .replace(/MIN\(/gi, 'Math.min(')
      .replace(/MAX\(/gi, 'Math.max(')
      .replace(/AVG\(/gi, '((...args) => args.reduce((a,b) => a+b, 0) / args.length)(')
      .replace(/SUM\(/gi, '((...args) => args.reduce((a,b) => a+b, 0))(');

    // Validate expression (basic security check)
    if (/[^0-9+\-*/().,%\s]/.test(expression.replace(/Math\.\w+/g, ''))) {
      // Only allow numbers and basic operators (after replacing Math functions)
      const allowed = /^[0-9+\-*/().,%\sMath.roundfloorceileabssqrtpowminmax]+$/;
      if (!allowed.test(expression)) {
        throw new Error('Invalid formula expression');
      }
    }

    // Evaluate
    const result = new Function(`return ${expression}`)();
    
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}

/**
 * Get fields referenced in a formula
 */
export function getFormulaFields(formula: string): string[] {
  const matches = formula.match(/\{([^}]+)\}/g) || [];
  return matches.map(m => m.slice(1, -1));
}

export default {
  validateField,
  validateModuleData,
  getValidationSchema,
  evaluateFormula,
  getFormulaFields,
};
