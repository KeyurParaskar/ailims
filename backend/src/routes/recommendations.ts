import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Common lab values for autofill suggestions
const commonValues = {
  sampleTypes: [
    'Blood',
    'Urine',
    'Tissue',
    'Saliva',
    'Swab',
    'Plasma',
    'Serum',
    'CSF',
    'Stool',
  ],
  testTypes: [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel (BMP)',
    'Comprehensive Metabolic Panel (CMP)',
    'Lipid Panel',
    'Liver Function Tests (LFT)',
    'Thyroid Panel',
    'Urinalysis',
    'Culture & Sensitivity',
    'PCR',
    'ELISA',
  ],
  units: [
    'mg/dL',
    'mmol/L',
    'g/dL',
    'mL',
    'µL',
    'ng/mL',
    'pg/mL',
    'IU/L',
    'U/L',
    '%',
  ],
  priorities: ['Routine', 'Urgent', 'STAT', 'ASAP'],
  statuses: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
};

// Reference ranges for common tests
const referenceRanges: Record<string, { min: number; max: number; unit: string; description: string }> = {
  'hemoglobin': { min: 12.0, max: 17.5, unit: 'g/dL', description: 'Hemoglobin level' },
  'glucose': { min: 70, max: 100, unit: 'mg/dL', description: 'Fasting blood glucose' },
  'cholesterol_total': { min: 0, max: 200, unit: 'mg/dL', description: 'Total cholesterol' },
  'cholesterol_ldl': { min: 0, max: 100, unit: 'mg/dL', description: 'LDL cholesterol' },
  'cholesterol_hdl': { min: 40, max: 60, unit: 'mg/dL', description: 'HDL cholesterol' },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL', description: 'Triglycerides' },
  'creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL', description: 'Serum creatinine' },
  'bun': { min: 7, max: 20, unit: 'mg/dL', description: 'Blood urea nitrogen' },
  'sodium': { min: 136, max: 145, unit: 'mmol/L', description: 'Serum sodium' },
  'potassium': { min: 3.5, max: 5.0, unit: 'mmol/L', description: 'Serum potassium' },
  'wbc': { min: 4.5, max: 11.0, unit: '10^3/µL', description: 'White blood cell count' },
  'rbc': { min: 4.5, max: 5.5, unit: '10^6/µL', description: 'Red blood cell count' },
  'platelets': { min: 150, max: 400, unit: '10^3/µL', description: 'Platelet count' },
};

// Get autofill suggestions
router.get('/autofill', (req: Request, res: Response) => {
  const { field, query } = req.query;

  if (!field) {
    return res.json(commonValues);
  }

  const fieldValues = commonValues[field as keyof typeof commonValues];
  if (!fieldValues) {
    return res.status(400).json({ error: 'Unknown field type' });
  }

  if (query && typeof query === 'string') {
    const filtered = fieldValues.filter((v) =>
      v.toLowerCase().includes(query.toLowerCase())
    );
    return res.json({ field, suggestions: filtered });
  }

  res.json({ field, suggestions: fieldValues });
});

// Get reference ranges for a test
router.get('/reference-range/:testId', (req: Request, res: Response) => {
  const testId = req.params.testId as string;
  const range = referenceRanges[testId.toLowerCase()];

  if (!range) {
    return res.status(404).json({ error: 'Reference range not found for this test' });
  }

  res.json({ testId, ...range });
});

// Get all reference ranges
router.get('/reference-ranges', (req: Request, res: Response) => {
  res.json({ ranges: referenceRanges });
});

// Validate a test result against reference range
router.post('/validate-result', (req: Request, res: Response) => {
  const { testId, value } = req.body;

  if (!testId || value === undefined) {
    return res.status(400).json({ error: 'testId and value are required' });
  }

  const range = referenceRanges[testId.toLowerCase()];
  if (!range) {
    return res.json({
      testId,
      value,
      status: 'unknown',
      message: 'No reference range available for this test',
    });
  }

  let status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  let severity: 'normal' | 'warning' | 'critical';

  const criticalLow = range.min * 0.7;
  const criticalHigh = range.max * 1.5;

  if (value < criticalLow) {
    status = 'critical_low';
    severity = 'critical';
  } else if (value > criticalHigh) {
    status = 'critical_high';
    severity = 'critical';
  } else if (value < range.min) {
    status = 'low';
    severity = 'warning';
  } else if (value > range.max) {
    status = 'high';
    severity = 'warning';
  } else {
    status = 'normal';
    severity = 'normal';
  }

  res.json({
    testId,
    value,
    unit: range.unit,
    referenceRange: { min: range.min, max: range.max },
    status,
    severity,
    message: status === 'normal'
      ? 'Value is within normal range'
      : `Value is ${status.replace('_', ' ')} (reference: ${range.min}-${range.max} ${range.unit})`,
  });
});

// Get workflow step recommendations based on current workflow
router.post('/recommend-steps', authenticateToken, (req: AuthRequest, res: Response) => {
  const { workflowType, currentSteps } = req.body;

  const recommendations: Record<string, string[]> = {
    'blood_analysis': [
      'Sample Collection',
      'Sample Verification',
      'Centrifugation',
      'Aliquoting',
      'Analysis',
      'Quality Control',
      'Result Review',
      'Report Generation',
      'Result Notification',
    ],
    'culture': [
      'Sample Collection',
      'Sample Registration',
      'Inoculation',
      'Incubation (24h)',
      'Colony Identification',
      'Sensitivity Testing',
      'Result Review',
      'Report Generation',
    ],
    'pcr': [
      'Sample Collection',
      'DNA/RNA Extraction',
      'Quality Check',
      'PCR Setup',
      'Amplification',
      'Gel Electrophoresis',
      'Result Analysis',
      'Report Generation',
    ],
    'general': [
      'Sample Reception',
      'Sample Processing',
      'Testing',
      'Quality Control',
      'Result Review',
      'Report Generation',
      'Archival',
    ],
  };

  const type = workflowType?.toLowerCase() || 'general';
  const suggestedSteps = recommendations[type] || recommendations['general'];

  // Filter out steps that already exist
  const existingStepNames = (currentSteps || []).map((s: any) => s.name?.toLowerCase());
  const newRecommendations = suggestedSteps.filter(
    (step) => !existingStepNames.includes(step.toLowerCase())
  );

  res.json({
    workflowType: type,
    recommendations: newRecommendations.slice(0, 5),
    allSteps: suggestedSteps,
  });
});

// Detect potential errors in sample data
router.post('/detect-errors', (req: Request, res: Response) => {
  const { sample } = req.body;
  const errors: Array<{ field: string; message: string; severity: 'warning' | 'error' }> = [];

  if (!sample) {
    return res.status(400).json({ error: 'Sample data is required' });
  }

  // Check for missing required fields
  if (!sample.sampleId) {
    errors.push({ field: 'sampleId', message: 'Sample ID is required', severity: 'error' });
  }
  if (!sample.patientId && !sample.subjectId) {
    errors.push({ field: 'patientId', message: 'Patient/Subject ID is missing', severity: 'warning' });
  }
  if (!sample.collectionDate) {
    errors.push({ field: 'collectionDate', message: 'Collection date is required', severity: 'error' });
  }
  if (!sample.sampleType) {
    errors.push({ field: 'sampleType', message: 'Sample type is required', severity: 'error' });
  }

  // Check for logical errors
  if (sample.collectionDate) {
    const collectionDate = new Date(sample.collectionDate);
    const now = new Date();
    if (collectionDate > now) {
      errors.push({ field: 'collectionDate', message: 'Collection date cannot be in the future', severity: 'error' });
    }
    const daysDiff = (now.getTime() - collectionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      errors.push({ field: 'collectionDate', message: 'Sample is more than 7 days old - verify stability', severity: 'warning' });
    }
  }

  // Check for data format issues
  if (sample.sampleId && !/^[A-Z0-9-]+$/i.test(sample.sampleId)) {
    errors.push({ field: 'sampleId', message: 'Sample ID contains invalid characters', severity: 'warning' });
  }

  res.json({
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    errorCount: errors.filter((e) => e.severity === 'error').length,
    warningCount: errors.filter((e) => e.severity === 'warning').length,
  });
});

export default router;
