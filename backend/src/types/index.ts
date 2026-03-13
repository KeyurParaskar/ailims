// User type
export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'lab_manager' | 'lab_tech' | 'viewer';
  created_at: Date;
  updated_at: Date;
}

// Workflow type
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  config: Record<string, any>;
  created_by?: number;
  is_template: boolean;
  status: 'draft' | 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

// Workflow Step type
export interface WorkflowStep {
  id: number;
  workflow_id: number;
  name: string;
  description?: string;
  step_order: number;
  config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Sample type
export interface Sample {
  id: number;
  sample_id: string;
  name: string;
  type?: string;
  metadata: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Workflow Instance type
export interface WorkflowInstance {
  id: number;
  workflow_id: number;
  sample_id?: number;
  current_step?: number;
  status: 'in_progress' | 'completed' | 'paused' | 'failed';
  started_at: Date;
  completed_at?: Date;
  data: Record<string, any>;
}

// Audit Log type
export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: Date;
}

// Notification type
export interface Notification {
  id: number;
  user_id?: number;
  title: string;
  message?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: Date;
}
