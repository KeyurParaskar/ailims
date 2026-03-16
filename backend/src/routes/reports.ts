import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Report templates
interface ReportTemplate {
  id: string;
  name: string;
  type: 'sample_results' | 'qc_summary' | 'audit_report' | 'workflow_status' | 'equipment_log' | 'custom';
  description: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  createdBy: string;
  isSystemTemplate: boolean;
}

const templates: ReportTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Sample Results Report',
    type: 'sample_results',
    description: 'Comprehensive report of sample test results with reference ranges',
    sections: ['patient_info', 'sample_details', 'test_results', 'reference_ranges', 'notes', 'signatures'],
    format: 'pdf',
    createdBy: 'system',
    isSystemTemplate: true,
  },
  {
    id: 'TPL-002',
    name: 'Daily QC Summary',
    type: 'qc_summary',
    description: 'Daily quality control metrics and status',
    sections: ['qc_metrics', 'control_values', 'deviations', 'corrective_actions'],
    format: 'pdf',
    createdBy: 'system',
    isSystemTemplate: true,
  },
  {
    id: 'TPL-003',
    name: 'Audit Trail Export',
    type: 'audit_report',
    description: 'Complete audit log with user actions and timestamps',
    sections: ['summary', 'actions_by_user', 'actions_by_type', 'detailed_log'],
    format: 'excel',
    createdBy: 'system',
    isSystemTemplate: true,
  },
  {
    id: 'TPL-004',
    name: 'Workflow Status Report',
    type: 'workflow_status',
    description: 'Current status of all active workflows',
    sections: ['overview', 'in_progress', 'completed', 'blocked', 'timeline'],
    format: 'pdf',
    createdBy: 'system',
    isSystemTemplate: true,
  },
  {
    id: 'TPL-005',
    name: 'Equipment Maintenance Log',
    type: 'equipment_log',
    description: 'Equipment status, calibration, and maintenance history',
    sections: ['equipment_list', 'calibration_schedule', 'maintenance_history', 'alerts'],
    format: 'excel',
    createdBy: 'system',
    isSystemTemplate: true,
  },
  {
    id: 'TPL-006',
    name: 'Monthly Statistics',
    type: 'custom',
    description: 'Monthly sample processing statistics and trends',
    sections: ['sample_count', 'turnaround_time', 'rejection_rate', 'trends'],
    format: 'pdf',
    createdBy: 'admin@ailims.com',
    isSystemTemplate: false,
  },
];

// Generated reports storage (mock)
interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedBy: string;
  generatedAt: string;
  parameters: Record<string, any>;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: number;
}

const generatedReports: GeneratedReport[] = [];

// Get all templates
router.get('/templates', (req: Request, res: Response) => {
  const { type, format } = req.query;

  let filtered = [...templates];

  if (type) {
    filtered = filtered.filter((t) => t.type === type);
  }
  if (format) {
    filtered = filtered.filter((t) => t.format === format);
  }

  res.json(filtered);
});

// Get template by ID
router.get('/templates/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const template = templates.find((t) => t.id === id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

// Create custom template
router.post('/templates', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, type, description, sections, format } = req.body;

  if (!name || !type || !sections || !format) {
    return res.status(400).json({
      error: 'Missing required fields: name, type, sections, format',
    });
  }

  const newTemplate: ReportTemplate = {
    id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
    name,
    type,
    description: description || '',
    sections,
    format,
    createdBy: req.user?.email || 'unknown',
    isSystemTemplate: false,
  };

  templates.push(newTemplate);

  res.status(201).json(newTemplate);
});

// Generate a report
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { templateId, parameters } = req.body;

  if (!templateId) {
    return res.status(400).json({ error: 'Template ID required' });
  }

  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const reportId = `RPT-${Date.now()}`;

  const report: GeneratedReport = {
    id: reportId,
    templateId,
    templateName: template.name,
    generatedBy: req.user?.email || 'unknown',
    generatedAt: new Date().toISOString(),
    parameters: parameters || {},
    status: 'generating',
  };

  generatedReports.push(report);

  // Simulate report generation (would be async in production)
  setTimeout(() => {
    const idx = generatedReports.findIndex((r) => r.id === reportId);
    if (idx !== -1) {
      generatedReports[idx].status = 'completed';
      generatedReports[idx].downloadUrl = `/api/reports/download/${reportId}`;
      generatedReports[idx].fileSize = Math.floor(Math.random() * 500000) + 50000;
    }
  }, 2000);

  res.status(202).json({
    message: 'Report generation started',
    reportId,
    status: 'generating',
    estimatedTime: '2-5 seconds',
  });
});

// Get report status
router.get('/status/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const report = generatedReports.find((r) => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json(report);
});

// List generated reports
router.get('/generated', authenticateToken, (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;
  const isAdmin = req.user?.role === 'admin';

  let reports = [...generatedReports];

  // Non-admins can only see their own reports
  if (!isAdmin) {
    reports = reports.filter((r) => r.generatedBy === userEmail);
  }

  // Sort by most recent
  reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  res.json(reports);
});

// Download report (mock - returns sample data)
router.get('/download/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const report = generatedReports.find((r) => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (report.status !== 'completed') {
    return res.status(400).json({
      error: 'Report not ready',
      status: report.status,
    });
  }

  // In production, this would stream the actual file
  const template = templates.find((t) => t.id === report.templateId);

  res.json({
    message: 'Download would start here in production',
    reportId: id,
    filename: `${report.templateName.replace(/\s+/g, '_')}_${new Date(report.generatedAt).toISOString().split('T')[0]}.${template?.format || 'pdf'}`,
    format: template?.format || 'pdf',
    size: report.fileSize,
    mockData: generateMockReportData(report, template!),
  });
});

// Generate mock report data based on template
function generateMockReportData(report: GeneratedReport, template: ReportTemplate): any {
  const baseData = {
    reportId: report.id,
    generatedAt: report.generatedAt,
    generatedBy: report.generatedBy,
    templateName: template.name,
  };

  switch (template.type) {
    case 'sample_results':
      return {
        ...baseData,
        patient: {
          id: 'PAT-001',
          name: 'John Doe',
          dob: '1985-03-15',
          mrn: 'MRN-123456',
        },
        sample: {
          id: 'SMP-2026-0001',
          type: 'Blood',
          collectionDate: '2026-03-20',
          receivedDate: '2026-03-20',
        },
        results: [
          { test: 'Hemoglobin', value: 14.2, unit: 'g/dL', range: '12.0-16.0', status: 'normal' },
          { test: 'Glucose', value: 95, unit: 'mg/dL', range: '70-100', status: 'normal' },
          { test: 'Cholesterol', value: 210, unit: 'mg/dL', range: '<200', status: 'high' },
        ],
      };

    case 'qc_summary':
      return {
        ...baseData,
        date: new Date().toISOString().split('T')[0],
        overallStatus: 'PASS',
        metrics: [
          { control: 'Level 1', target: 100, actual: 98.5, sd: 1.2, cv: '1.2%', status: 'Pass' },
          { control: 'Level 2', target: 200, actual: 202.1, sd: 2.4, cv: '1.2%', status: 'Pass' },
        ],
        testsRun: 156,
        testsPass: 154,
        testsFail: 2,
      };

    case 'workflow_status':
      return {
        ...baseData,
        summary: {
          active: 12,
          completed: 45,
          blocked: 2,
          total: 59,
        },
        workflows: [
          { id: 'WF-001', name: 'Blood Analysis', status: 'in_progress', progress: 75 },
          { id: 'WF-002', name: 'Urine Test', status: 'completed', progress: 100 },
        ],
      };

    case 'equipment_log':
      return {
        ...baseData,
        equipmentCount: 7,
        calibrationsDue: 2,
        alerts: 3,
        equipment: [
          { id: 'EQ-001', name: 'Hematology Analyzer', status: 'online', nextCal: '2026-04-01' },
          { id: 'EQ-002', name: 'Chemistry Analyzer', status: 'online', nextCal: '2026-04-10' },
        ],
      };

    default:
      return baseData;
  }
}

// Quick report endpoints
router.get('/quick/daily-summary', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    date: new Date().toISOString().split('T')[0],
    samplesReceived: Math.floor(Math.random() * 50) + 20,
    samplesProcessed: Math.floor(Math.random() * 45) + 15,
    samplesCompleted: Math.floor(Math.random() * 40) + 10,
    avgTurnaroundTime: '2.5 hours',
    activeWorkflows: Math.floor(Math.random() * 15) + 5,
    equipmentOnline: 5,
    equipmentTotal: 7,
    pendingApprovals: Math.floor(Math.random() * 10),
    criticalAlerts: Math.floor(Math.random() * 3),
  });
});

router.get('/quick/trends', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;

  const trends = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      samplesProcessed: Math.floor(Math.random() * 50) + 30,
      turnaroundMinutes: Math.floor(Math.random() * 60) + 90,
      errorRate: (Math.random() * 2).toFixed(2),
    });
  }

  res.json({
    period: `Last ${days} days`,
    trends,
  });
});

export default router;
