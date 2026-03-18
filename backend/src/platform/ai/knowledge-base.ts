/**
 * Lab Knowledge Base
 * Domain knowledge for different lab types, industry standards, and common patterns
 */

// =============================================================================
// LAB TYPE DEFINITIONS
// =============================================================================

export interface LabTypeDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  regulations?: string[];
  commonModules: string[];
  suggestedFields: FieldSuggestion[];
  suggestedWorkflows: WorkflowSuggestion[];
}

export interface FieldSuggestion {
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  config?: Record<string, any>;
}

export interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: string[];
}

// =============================================================================
// LAB TYPES KNOWLEDGE BASE
// =============================================================================

export const LAB_TYPES: Record<string, LabTypeDefinition> = {
  
  // FORENSIC LABS
  forensic_dna: {
    id: 'forensic_dna',
    name: 'Forensic DNA Laboratory',
    description: 'DNA analysis for criminal investigations, paternity testing, and identification',
    category: 'forensic',
    keywords: ['dna', 'forensic', 'crime', 'evidence', 'str', 'codis', 'genetics', 'paternity'],
    regulations: ['ISO 17025', 'FBI QAS', 'SWGDAM'],
    commonModules: ['evidence_intake', 'dna_extraction', 'pcr_amplification', 'analysis', 'reporting'],
    suggestedFields: [
      { id: 'case_number', name: 'Case Number', type: 'text', description: 'Unique case identifier', required: true },
      { id: 'evidence_id', name: 'Evidence ID', type: 'barcode', description: 'Barcode for evidence tracking', required: true, config: { barcodeFormat: 'code128', autoGenerate: true } },
      { id: 'evidence_type', name: 'Evidence Type', type: 'dropdown', description: 'Type of biological evidence', config: { options: [
        { value: 'blood', label: 'Blood' },
        { value: 'saliva', label: 'Saliva' },
        { value: 'semen', label: 'Semen' },
        { value: 'hair', label: 'Hair' },
        { value: 'tissue', label: 'Tissue' },
        { value: 'bone', label: 'Bone' },
        { value: 'touch_dna', label: 'Touch DNA' },
        { value: 'other', label: 'Other' }
      ]}},
      { id: 'collection_date', name: 'Collection Date', type: 'date', description: 'Date evidence was collected', required: true },
      { id: 'submitting_agency', name: 'Submitting Agency', type: 'text', description: 'Law enforcement agency' },
      { id: 'chain_of_custody', name: 'Chain of Custody', type: 'table', description: 'Custody transfer log', config: {
        columns: [
          { id: 'date', name: 'Date/Time', type: 'datetime' },
          { id: 'from', name: 'Released By', type: 'text' },
          { id: 'to', name: 'Received By', type: 'text' },
          { id: 'purpose', name: 'Purpose', type: 'text' }
        ]
      }},
      { id: 'dna_concentration', name: 'DNA Concentration', type: 'number', description: 'ng/µL', config: { precision: 2, suffix: 'ng/µL' } },
      { id: 'extraction_method', name: 'Extraction Method', type: 'dropdown', config: { options: [
        { value: 'organic', label: 'Organic (Phenol-Chloroform)' },
        { value: 'chelex', label: 'Chelex' },
        { value: 'silica', label: 'Silica-based' },
        { value: 'magnetic', label: 'Magnetic Bead' }
      ]}},
      { id: 'str_profile', name: 'STR Profile', type: 'textarea', description: 'Allele calls' },
      { id: 'codis_eligible', name: 'CODIS Eligible', type: 'boolean', description: 'Eligible for CODIS upload' },
      { id: 'analyst', name: 'Analyst', type: 'user', description: 'Assigned analyst', config: { roles: ['analyst', 'lab_tech'] } },
      { id: 'reviewer', name: 'Technical Reviewer', type: 'user', description: 'Technical reviewer', config: { roles: ['reviewer', 'lab_manager'] } },
      { id: 'status', name: 'Status', type: 'status', config: { statuses: [
        { value: 'received', label: 'Received', color: '#2196f3' },
        { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
        { value: 'analysis_complete', label: 'Analysis Complete', color: '#9c27b0' },
        { value: 'review', label: 'Under Review', color: '#00bcd4' },
        { value: 'approved', label: 'Approved', color: '#4caf50' },
        { value: 'reported', label: 'Reported', color: '#8bc34a' }
      ]}}
    ],
    suggestedWorkflows: [
      { id: 'evidence_intake', name: 'Evidence Intake', description: 'Log new evidence', trigger: 'on_create', steps: ['Assign barcode', 'Log chain of custody', 'Photograph evidence', 'Store in secure location'] },
      { id: 'extraction', name: 'DNA Extraction', description: 'Extract DNA from sample', trigger: 'manual', steps: ['Select method', 'Process sample', 'Quantify DNA', 'Record concentration'] },
      { id: 'technical_review', name: 'Technical Review', description: 'Review by qualified reviewer', trigger: 'on_status_change', steps: ['Review data', 'Verify conclusions', 'Approve or reject'] }
    ]
  },

  forensic_toxicology: {
    id: 'forensic_toxicology',
    name: 'Forensic Toxicology Laboratory',
    description: 'Drug and poison testing for death investigations and DUI cases',
    category: 'forensic',
    keywords: ['toxicology', 'drugs', 'poison', 'autopsy', 'dui', 'screening', 'confirmation'],
    regulations: ['ISO 17025', 'SOFT', 'AAFS'],
    commonModules: ['specimen_intake', 'screening', 'confirmation', 'reporting'],
    suggestedFields: [
      { id: 'case_number', name: 'Case Number', type: 'text', required: true },
      { id: 'specimen_id', name: 'Specimen ID', type: 'barcode', required: true },
      { id: 'specimen_type', name: 'Specimen Type', type: 'dropdown', config: { options: [
        { value: 'blood', label: 'Blood' },
        { value: 'urine', label: 'Urine' },
        { value: 'vitreous', label: 'Vitreous Humor' },
        { value: 'bile', label: 'Bile' },
        { value: 'liver', label: 'Liver Tissue' },
        { value: 'gastric', label: 'Gastric Contents' },
        { value: 'hair', label: 'Hair' }
      ]}},
      { id: 'case_type', name: 'Case Type', type: 'dropdown', config: { options: [
        { value: 'autopsy', label: 'Autopsy/Death Investigation' },
        { value: 'dui', label: 'DUI/DUID' },
        { value: 'drug_facilitated', label: 'Drug-Facilitated Crime' },
        { value: 'workplace', label: 'Workplace Testing' }
      ]}},
      { id: 'collection_date', name: 'Collection Date', type: 'datetime', required: true },
      { id: 'screening_results', name: 'Screening Results', type: 'table', config: {
        columns: [
          { id: 'drug_class', name: 'Drug Class', type: 'text' },
          { id: 'result', name: 'Result', type: 'dropdown' },
          { id: 'cutoff', name: 'Cutoff', type: 'number' }
        ]
      }},
      { id: 'confirmation_results', name: 'Confirmation Results', type: 'table', config: {
        columns: [
          { id: 'analyte', name: 'Analyte', type: 'text' },
          { id: 'concentration', name: 'Concentration', type: 'number' },
          { id: 'unit', name: 'Unit', type: 'text' },
          { id: 'method', name: 'Method', type: 'text' }
        ]
      }},
      { id: 'interpretation', name: 'Interpretation', type: 'richtext' },
      { id: 'status', name: 'Status', type: 'status' }
    ],
    suggestedWorkflows: [
      { id: 'specimen_login', name: 'Specimen Login', trigger: 'on_create', description: 'Log specimen', steps: ['Verify chain of custody', 'Assign ID', 'Aliquot specimen'] },
      { id: 'screen_to_confirm', name: 'Screen to Confirmation', trigger: 'on_update', description: 'Move positive screens to confirmation', steps: ['Review screening results', 'Select confirmatory tests'] }
    ]
  },

  // CLINICAL LABS
  clinical_chemistry: {
    id: 'clinical_chemistry',
    name: 'Clinical Chemistry Laboratory',
    description: 'Blood and body fluid testing for disease diagnosis and monitoring',
    category: 'clinical',
    keywords: ['clinical', 'chemistry', 'blood', 'patient', 'diagnosis', 'cmp', 'bmp', 'lipid'],
    regulations: ['CLIA', 'CAP', 'ISO 15189'],
    commonModules: ['patient_registration', 'sample_collection', 'testing', 'results', 'reporting'],
    suggestedFields: [
      { id: 'patient_id', name: 'Patient ID', type: 'text', required: true },
      { id: 'accession_number', name: 'Accession Number', type: 'autonumber', required: true, config: { pattern: 'ACC-{YYYY}{MM}-{0000}' } },
      { id: 'patient_name', name: 'Patient Name', type: 'text', required: true },
      { id: 'dob', name: 'Date of Birth', type: 'date', required: true },
      { id: 'ordering_physician', name: 'Ordering Physician', type: 'text' },
      { id: 'specimen_type', name: 'Specimen Type', type: 'dropdown', config: { options: [
        { value: 'serum', label: 'Serum' },
        { value: 'plasma', label: 'Plasma' },
        { value: 'whole_blood', label: 'Whole Blood' },
        { value: 'urine', label: 'Urine' },
        { value: 'csf', label: 'CSF' }
      ]}},
      { id: 'tests_ordered', name: 'Tests Ordered', type: 'multiselect', config: { options: [
        { value: 'cmp', label: 'Comprehensive Metabolic Panel' },
        { value: 'bmp', label: 'Basic Metabolic Panel' },
        { value: 'lipid', label: 'Lipid Panel' },
        { value: 'lft', label: 'Liver Function Tests' },
        { value: 'tft', label: 'Thyroid Function Tests' },
        { value: 'cbc', label: 'Complete Blood Count' }
      ]}},
      { id: 'collection_time', name: 'Collection Time', type: 'datetime', required: true },
      { id: 'received_time', name: 'Received Time', type: 'datetime' },
      { id: 'fasting', name: 'Fasting', type: 'boolean' },
      { id: 'results', name: 'Results', type: 'table', config: {
        columns: [
          { id: 'test', name: 'Test', type: 'text' },
          { id: 'result', name: 'Result', type: 'number' },
          { id: 'unit', name: 'Unit', type: 'text' },
          { id: 'reference_range', name: 'Reference Range', type: 'text' },
          { id: 'flag', name: 'Flag', type: 'dropdown' }
        ]
      }},
      { id: 'status', name: 'Status', type: 'status', config: { statuses: [
        { value: 'ordered', label: 'Ordered', color: '#9e9e9e' },
        { value: 'collected', label: 'Collected', color: '#2196f3' },
        { value: 'received', label: 'Received', color: '#00bcd4' },
        { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
        { value: 'resulted', label: 'Resulted', color: '#9c27b0' },
        { value: 'verified', label: 'Verified', color: '#4caf50' },
        { value: 'reported', label: 'Reported', color: '#8bc34a' }
      ]}}
    ],
    suggestedWorkflows: [
      { id: 'order_entry', name: 'Order Entry', trigger: 'on_create', description: 'New test order', steps: ['Verify patient info', 'Check for duplicates', 'Generate labels'] },
      { id: 'critical_value', name: 'Critical Value', trigger: 'on_update', description: 'Alert on critical results', steps: ['Check against critical limits', 'Notify physician', 'Document callback'] }
    ]
  },

  // ENVIRONMENTAL LABS
  environmental_water: {
    id: 'environmental_water',
    name: 'Environmental Water Testing Laboratory',
    description: 'Water quality testing for drinking water, wastewater, and environmental compliance',
    category: 'environmental',
    keywords: ['water', 'environmental', 'epa', 'drinking', 'wastewater', 'compliance', 'quality'],
    regulations: ['ISO 17025', 'EPA', 'NELAP'],
    commonModules: ['sample_reception', 'testing', 'qc', 'reporting'],
    suggestedFields: [
      { id: 'sample_id', name: 'Sample ID', type: 'barcode', required: true },
      { id: 'project_id', name: 'Project/Client', type: 'text' },
      { id: 'sample_type', name: 'Sample Type', type: 'dropdown', config: { options: [
        { value: 'drinking', label: 'Drinking Water' },
        { value: 'groundwater', label: 'Groundwater' },
        { value: 'surface', label: 'Surface Water' },
        { value: 'wastewater', label: 'Wastewater' },
        { value: 'stormwater', label: 'Stormwater' }
      ]}},
      { id: 'collection_date', name: 'Collection Date/Time', type: 'datetime', required: true },
      { id: 'received_date', name: 'Received Date/Time', type: 'datetime', required: true },
      { id: 'collection_location', name: 'Collection Location', type: 'location' },
      { id: 'collector', name: 'Collector', type: 'text' },
      { id: 'preservative', name: 'Preservative', type: 'dropdown', config: { options: [
        { value: 'none', label: 'None' },
        { value: 'hcl', label: 'HCl' },
        { value: 'hno3', label: 'HNO3' },
        { value: 'h2so4', label: 'H2SO4' },
        { value: 'naoh', label: 'NaOH' },
        { value: 'sodium_thiosulfate', label: 'Sodium Thiosulfate' }
      ]}},
      { id: 'temperature_on_receipt', name: 'Temperature on Receipt', type: 'number', config: { suffix: '°C' } },
      { id: 'tests_requested', name: 'Tests Requested', type: 'multiselect', config: { options: [
        { value: 'metals', label: 'Metals (ICP)' },
        { value: 'voc', label: 'VOCs' },
        { value: 'svoc', label: 'SVOCs' },
        { value: 'bacteria', label: 'Bacteria (Total Coliform/E.coli)' },
        { value: 'nutrients', label: 'Nutrients (N, P)' },
        { value: 'general', label: 'General Chemistry (pH, conductivity)' }
      ]}},
      { id: 'hold_time', name: 'Hold Time Status', type: 'formula', config: { formula: 'DATEDIFF(NOW(), {collection_date})' } },
      { id: 'status', name: 'Status', type: 'status' }
    ],
    suggestedWorkflows: [
      { id: 'sample_login', name: 'Sample Login', trigger: 'on_create', description: 'Log new sample', steps: ['Verify cooler temp', 'Check preservatives', 'Log chain of custody', 'Generate labels'] },
      { id: 'hold_time_alert', name: 'Hold Time Alert', trigger: 'scheduled', description: 'Alert on approaching hold times', steps: ['Check hold times', 'Notify analysts', 'Prioritize testing'] }
    ]
  },

  // PHARMACEUTICAL LABS  
  pharma_qc: {
    id: 'pharma_qc',
    name: 'Pharmaceutical QC Laboratory',
    description: 'Quality control testing of pharmaceutical products for release',
    category: 'pharmaceutical',
    keywords: ['pharma', 'pharmaceutical', 'qc', 'quality', 'gmp', 'release', 'stability'],
    regulations: ['cGMP', 'FDA 21 CFR Part 11', 'ICH', 'USP'],
    commonModules: ['sample_management', 'testing', 'stability', 'release', 'deviations'],
    suggestedFields: [
      { id: 'sample_id', name: 'Sample ID', type: 'barcode', required: true },
      { id: 'batch_number', name: 'Batch/Lot Number', type: 'text', required: true },
      { id: 'product_name', name: 'Product Name', type: 'lookup', config: { sourceModule: 'products', displayField: 'name' } },
      { id: 'sample_type', name: 'Sample Type', type: 'dropdown', config: { options: [
        { value: 'raw_material', label: 'Raw Material' },
        { value: 'in_process', label: 'In-Process' },
        { value: 'finished', label: 'Finished Product' },
        { value: 'stability', label: 'Stability' },
        { value: 'retention', label: 'Retention' }
      ]}},
      { id: 'manufacturing_date', name: 'Manufacturing Date', type: 'date' },
      { id: 'expiry_date', name: 'Expiry Date', type: 'date' },
      { id: 'specification', name: 'Specification', type: 'lookup', config: { sourceModule: 'specifications' } },
      { id: 'tests', name: 'Tests', type: 'table', config: {
        columns: [
          { id: 'test_name', name: 'Test', type: 'text' },
          { id: 'method', name: 'Method', type: 'text' },
          { id: 'specification', name: 'Specification', type: 'text' },
          { id: 'result', name: 'Result', type: 'text' },
          { id: 'pass_fail', name: 'Pass/Fail', type: 'dropdown' }
        ]
      }},
      { id: 'overall_result', name: 'Overall Result', type: 'dropdown', config: { options: [
        { value: 'pass', label: 'Pass' },
        { value: 'fail', label: 'Fail' },
        { value: 'pending', label: 'Pending' }
      ]}},
      { id: 'analyst', name: 'Analyst', type: 'user' },
      { id: 'reviewer', name: 'Reviewer', type: 'user' },
      { id: 'approval_signature', name: 'QA Approval', type: 'signature', config: { requirePassword: true, meaning: 'I approve the release of this batch' } },
      { id: 'status', name: 'Status', type: 'status' }
    ],
    suggestedWorkflows: [
      { id: 'sample_login', name: 'Sample Login', trigger: 'on_create', description: 'Log QC sample', steps: ['Verify sample info', 'Link to specification', 'Assign tests'] },
      { id: 'review_approval', name: 'Review and Approval', trigger: 'on_status_change', description: 'QA review workflow', steps: ['Analyst review', 'Supervisor review', 'QA approval', 'Release decision'] }
    ]
  },

  // RESEARCH LABS
  research_biobank: {
    id: 'research_biobank',
    name: 'Research Biobank',
    description: 'Biospecimen storage and tracking for research studies',
    category: 'research',
    keywords: ['biobank', 'biospecimen', 'research', 'storage', 'repository', 'samples'],
    regulations: ['ISBER', 'CAP BAP', 'IRB'],
    commonModules: ['donor_registration', 'specimen_collection', 'processing', 'storage', 'distribution'],
    suggestedFields: [
      { id: 'specimen_id', name: 'Specimen ID', type: 'barcode', required: true },
      { id: 'donor_id', name: 'Donor ID', type: 'text', required: true },
      { id: 'study', name: 'Study/Protocol', type: 'lookup', config: { sourceModule: 'studies' } },
      { id: 'consent_status', name: 'Consent Status', type: 'dropdown', config: { options: [
        { value: 'consented', label: 'Consented' },
        { value: 'withdrawn', label: 'Withdrawn' },
        { value: 'pending', label: 'Pending' }
      ]}},
      { id: 'specimen_type', name: 'Specimen Type', type: 'dropdown', config: { options: [
        { value: 'whole_blood', label: 'Whole Blood' },
        { value: 'serum', label: 'Serum' },
        { value: 'plasma', label: 'Plasma' },
        { value: 'pbmc', label: 'PBMCs' },
        { value: 'dna', label: 'DNA' },
        { value: 'rna', label: 'RNA' },
        { value: 'tissue', label: 'Tissue' },
        { value: 'ffpe', label: 'FFPE Block' }
      ]}},
      { id: 'collection_date', name: 'Collection Date', type: 'datetime', required: true },
      { id: 'volume', name: 'Volume/Amount', type: 'number', config: { suffix: 'mL' } },
      { id: 'storage_location', name: 'Storage Location', type: 'text', description: 'Freezer/Rack/Box/Position' },
      { id: 'storage_temp', name: 'Storage Temperature', type: 'dropdown', config: { options: [
        { value: 'rt', label: 'Room Temperature' },
        { value: '4c', label: '4°C' },
        { value: '-20c', label: '-20°C' },
        { value: '-80c', label: '-80°C' },
        { value: 'ln2', label: 'Liquid Nitrogen' }
      ]}},
      { id: 'aliquots', name: 'Number of Aliquots', type: 'number' },
      { id: 'available_volume', name: 'Available Volume', type: 'number', config: { suffix: 'mL' } },
      { id: 'quality_score', name: 'Quality Score', type: 'rating', config: { maxRating: 5 } },
      { id: 'status', name: 'Status', type: 'status', config: { statuses: [
        { value: 'available', label: 'Available', color: '#4caf50' },
        { value: 'reserved', label: 'Reserved', color: '#ff9800' },
        { value: 'distributed', label: 'Distributed', color: '#2196f3' },
        { value: 'exhausted', label: 'Exhausted', color: '#9e9e9e' },
        { value: 'qc_fail', label: 'QC Failed', color: '#f44336' }
      ]}}
    ],
    suggestedWorkflows: [
      { id: 'collection', name: 'Specimen Collection', trigger: 'on_create', description: 'Log new specimen', steps: ['Verify consent', 'Assign ID', 'Process specimen', 'Aliquot', 'Store'] },
      { id: 'distribution', name: 'Distribution Request', trigger: 'manual', description: 'Fulfill specimen request', steps: ['Verify requester', 'Check availability', 'Pick specimens', 'Ship', 'Update inventory'] }
    ]
  }
};

// =============================================================================
// FIELD TYPE SUGGESTIONS BY CONTEXT
// =============================================================================

export const FIELD_PATTERNS: Record<string, { type: string; config?: Record<string, any> }> = {
  // ID fields
  'id': { type: 'autonumber' },
  'case_number': { type: 'text' },
  'sample_id': { type: 'barcode', config: { autoGenerate: true } },
  'specimen_id': { type: 'barcode', config: { autoGenerate: true } },
  'barcode': { type: 'barcode' },
  'accession': { type: 'autonumber' },
  
  // Date/Time
  'date': { type: 'date' },
  'time': { type: 'time' },
  'datetime': { type: 'datetime' },
  'collection_date': { type: 'datetime' },
  'received_date': { type: 'datetime' },
  'expiry': { type: 'date' },
  
  // People
  'analyst': { type: 'user', config: { roles: ['analyst', 'lab_tech'] } },
  'reviewer': { type: 'user', config: { roles: ['reviewer', 'supervisor'] } },
  'physician': { type: 'text' },
  'patient': { type: 'text' },
  'collector': { type: 'text' },
  
  // Measurements
  'concentration': { type: 'number', config: { precision: 2 } },
  'volume': { type: 'number', config: { suffix: 'mL' } },
  'weight': { type: 'number', config: { suffix: 'g' } },
  'temperature': { type: 'number', config: { suffix: '°C' } },
  'ph': { type: 'number', config: { min: 0, max: 14, precision: 2 } },
  
  // Status
  'status': { type: 'status' },
  'result': { type: 'dropdown' },
  'pass_fail': { type: 'dropdown', config: { options: [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }] } },
  
  // Notes
  'notes': { type: 'textarea' },
  'comments': { type: 'textarea' },
  'description': { type: 'textarea' },
  'interpretation': { type: 'richtext' },
  
  // Chain of Custody
  'chain_of_custody': { type: 'table' },
  'custody': { type: 'table' },
  
  // Signatures
  'signature': { type: 'signature' },
  'approval': { type: 'signature', config: { requirePassword: true } },
  
  // Location
  'location': { type: 'location' },
  'storage_location': { type: 'text' },
  'position': { type: 'text' }
};

// =============================================================================
// WORKFLOW PATTERNS
// =============================================================================

export const WORKFLOW_PATTERNS = {
  intake: {
    name: 'Sample/Evidence Intake',
    trigger: 'on_create',
    steps: ['Verify information', 'Assign unique ID', 'Log receipt', 'Initial inspection', 'Assign storage location']
  },
  testing: {
    name: 'Testing Workflow',
    trigger: 'manual',
    steps: ['Select method', 'Prepare sample', 'Run test', 'Record results', 'Review data']
  },
  review: {
    name: 'Review and Approval',
    trigger: 'on_status_change',
    steps: ['Technical review', 'Administrative review', 'Approval decision', 'Generate report']
  },
  quality_control: {
    name: 'QC Check',
    trigger: 'on_update',
    steps: ['Run QC samples', 'Check control limits', 'Document QC results', 'Accept or reject run']
  },
  reporting: {
    name: 'Report Generation',
    trigger: 'on_status_change',
    steps: ['Compile results', 'Format report', 'Review report', 'Issue report']
  },
  alert: {
    name: 'Alert/Notification',
    trigger: 'on_update',
    steps: ['Check trigger condition', 'Identify recipients', 'Send notification', 'Log alert']
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function findLabType(prompt: string): LabTypeDefinition | null {
  const promptLower = prompt.toLowerCase();
  
  // Score each lab type by keyword matches
  let bestMatch: LabTypeDefinition | null = null;
  let bestScore = 0;
  
  for (const labType of Object.values(LAB_TYPES)) {
    let score = 0;
    
    // Check keywords
    for (const keyword of labType.keywords) {
      if (promptLower.includes(keyword)) {
        score += 2;
      }
    }
    
    // Check name
    if (promptLower.includes(labType.name.toLowerCase())) {
      score += 5;
    }
    
    // Check category
    if (promptLower.includes(labType.category)) {
      score += 1;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = labType;
    }
  }
  
  return bestScore >= 2 ? bestMatch : null;
}

export function suggestFieldType(fieldName: string): { type: string; config?: Record<string, any> } | null {
  const nameLower = fieldName.toLowerCase().replace(/[_\s-]/g, '_');
  
  // Direct match
  if (FIELD_PATTERNS[nameLower]) {
    return FIELD_PATTERNS[nameLower];
  }
  
  // Partial match
  for (const [pattern, suggestion] of Object.entries(FIELD_PATTERNS)) {
    if (nameLower.includes(pattern) || pattern.includes(nameLower)) {
      return suggestion;
    }
  }
  
  return null;
}

export function getLabTypeCategories(): string[] {
  const categories = new Set<string>();
  for (const labType of Object.values(LAB_TYPES)) {
    categories.add(labType.category);
  }
  return Array.from(categories);
}

export function getLabTypesByCategory(category: string): LabTypeDefinition[] {
  return Object.values(LAB_TYPES).filter(lt => lt.category === category);
}
