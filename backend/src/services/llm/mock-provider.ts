import { LLMProvider, LLMMessage, LLMCompletionOptions } from './index';

// Mock provider that returns templated responses
// Used as fallback when no LLM is available
export class MockProvider implements LLMProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true;
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    const userMessage = messages.find((m) => m.role === 'user')?.content || '';
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';

    // Detect the type of request and return appropriate mock response
    if (systemMessage.includes('laboratory workflows') && userMessage.toLowerCase().includes('workflow')) {
      return this.generateMockWorkflow(userMessage);
    }

    if (systemMessage.includes('search') || userMessage.toLowerCase().includes('search')) {
      return this.generateMockSearch(userMessage);
    }

    if (userMessage.toLowerCase().includes('step') || userMessage.toLowerCase().includes('suggest')) {
      return this.generateMockStep(userMessage);
    }

    // Generic response
    return JSON.stringify({
      message: 'This is a mock response. Configure an LLM provider for real AI capabilities.',
      input: userMessage.substring(0, 100),
    });
  }

  private generateMockWorkflow(input: string): string {
    const lowerInput = input.toLowerCase();

    // Detect workflow type from input
    let workflowType = 'general';
    if (lowerInput.includes('blood')) workflowType = 'blood';
    else if (lowerInput.includes('urine')) workflowType = 'urine';
    else if (lowerInput.includes('pcr') || lowerInput.includes('molecular')) workflowType = 'pcr';
    else if (lowerInput.includes('culture')) workflowType = 'culture';
    else if (lowerInput.includes('sample') && lowerInput.includes('intake')) workflowType = 'intake';

    const workflows: Record<string, any> = {
      blood: {
        name: 'Blood Sample Analysis Workflow',
        description: 'Complete workflow for blood sample processing and analysis',
        steps: [
          { name: 'Sample Collection', description: 'Collect blood sample from patient', type: 'collection', config: {} },
          { name: 'Centrifugation', description: 'Centrifuge sample to separate components', type: 'analysis', config: { duration: '10 min', rpm: 3000 } },
          { name: 'Complete Blood Count', description: 'Run CBC analysis on hematology analyzer', type: 'analysis', config: {} },
          { name: 'Quality Review', description: 'Review results for accuracy', type: 'review', config: {} },
          { name: 'Result Notification', description: 'Send results to ordering physician', type: 'notification', config: {} },
        ],
      },
      urine: {
        name: 'Urinalysis Workflow',
        description: 'Standard urinalysis processing workflow',
        steps: [
          { name: 'Sample Reception', description: 'Receive and log urine sample', type: 'collection', config: {} },
          { name: 'Visual Examination', description: 'Assess color, clarity, and odor', type: 'analysis', config: {} },
          { name: 'Chemical Analysis', description: 'Run dipstick and chemical tests', type: 'analysis', config: {} },
          { name: 'Microscopic Exam', description: 'Review sediment under microscope', type: 'analysis', config: {} },
          { name: 'Report Generation', description: 'Generate and validate report', type: 'review', config: {} },
        ],
      },
      pcr: {
        name: 'PCR Testing Workflow',
        description: 'Molecular PCR testing protocol',
        steps: [
          { name: 'Sample Preparation', description: 'Extract nucleic acids from sample', type: 'collection', config: {} },
          { name: 'Reagent Setup', description: 'Prepare PCR master mix', type: 'custom', config: {} },
          { name: 'Amplification', description: 'Run PCR cycles on thermal cycler', type: 'analysis', config: { cycles: 40 } },
          { name: 'Result Analysis', description: 'Analyze amplification curves', type: 'analysis', config: {} },
          { name: 'Validation', description: 'Validate results against controls', type: 'review', config: {} },
        ],
      },
      culture: {
        name: 'Microbiology Culture Workflow',
        description: 'Bacterial culture and identification workflow',
        steps: [
          { name: 'Specimen Processing', description: 'Process and plate specimen', type: 'collection', config: {} },
          { name: 'Incubation', description: 'Incubate plates at appropriate temperature', type: 'analysis', config: { temp: '37C', duration: '24-48h' } },
          { name: 'Colony Examination', description: 'Examine colony morphology', type: 'analysis', config: {} },
          { name: 'Identification', description: 'Identify organisms using biochemical tests', type: 'analysis', config: {} },
          { name: 'Susceptibility Testing', description: 'Perform antibiotic susceptibility', type: 'analysis', config: {} },
          { name: 'Final Report', description: 'Generate culture report', type: 'review', config: {} },
        ],
      },
      intake: {
        name: 'Sample Intake Workflow',
        description: 'Standard sample intake and registration workflow',
        steps: [
          { name: 'Sample Receipt', description: 'Receive sample and verify requisition', type: 'collection', config: {} },
          { name: 'Barcode Labeling', description: 'Generate and apply barcode labels', type: 'custom', config: {} },
          { name: 'Quality Check', description: 'Verify sample integrity and adequacy', type: 'review', config: {} },
          { name: 'System Registration', description: 'Register sample in LIMS', type: 'custom', config: {} },
          { name: 'Routing', description: 'Route to appropriate department', type: 'notification', config: {} },
        ],
      },
      general: {
        name: 'Laboratory Workflow',
        description: 'General laboratory processing workflow',
        steps: [
          { name: 'Sample Registration', description: 'Register and label incoming sample', type: 'collection', config: {} },
          { name: 'Pre-analytical Processing', description: 'Prepare sample for testing', type: 'custom', config: {} },
          { name: 'Analysis', description: 'Perform required tests', type: 'analysis', config: {} },
          { name: 'Quality Control', description: 'Review and validate results', type: 'review', config: {} },
          { name: 'Result Release', description: 'Approve and release results', type: 'notification', config: {} },
        ],
      },
    };

    return JSON.stringify(workflows[workflowType]);
  }

  private generateMockSearch(input: string): string {
    const lowerInput = input.toLowerCase();

    return JSON.stringify({
      interpretation: `Searching for: ${input.substring(0, 50)}`,
      filters: {
        status: lowerInput.includes('pending') ? 'pending' : lowerInput.includes('completed') ? 'completed' : undefined,
        type: lowerInput.includes('blood') ? 'blood' : lowerInput.includes('urine') ? 'urine' : undefined,
        urgent: lowerInput.includes('urgent') || lowerInput.includes('stat'),
      },
      suggestions: [
        'View all samples',
        'Filter by date range',
        'Check pending approvals',
      ],
    });
  }

  private generateMockStep(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('collection') || lowerInput.includes('intake')) {
      return JSON.stringify({
        name: 'Sample Processing',
        description: 'Process and prepare sample for analysis',
        type: 'analysis',
        config: {},
      });
    }

    if (lowerInput.includes('analysis')) {
      return JSON.stringify({
        name: 'Quality Review',
        description: 'Review analysis results for accuracy',
        type: 'review',
        config: {},
      });
    }

    if (lowerInput.includes('review')) {
      return JSON.stringify({
        name: 'Result Notification',
        description: 'Send results to requesting party',
        type: 'notification',
        config: {},
      });
    }

    return JSON.stringify({
      name: 'Next Step',
      description: 'Continue with workflow processing',
      type: 'custom',
      config: {},
    });
  }
}
