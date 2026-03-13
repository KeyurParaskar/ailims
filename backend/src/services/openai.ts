import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedWorkflowStep {
  name: string;
  description: string;
  type: 'collection' | 'analysis' | 'review' | 'notification' | 'custom';
  config?: Record<string, any>;
}

export interface ParsedWorkflow {
  name: string;
  description: string;
  steps: ParsedWorkflowStep[];
}

const SYSTEM_PROMPT = `You are an AI assistant that helps create laboratory workflows. 
When given a natural language description, you should parse it and return a structured workflow.

Available step types:
- collection: For sample collection, intake, or registration
- analysis: For testing, measurement, or analysis procedures
- review: For review, approval, or quality control steps
- notification: For alerts, notifications, or communications
- custom: For any other type of step

Return your response as a valid JSON object with this structure:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "steps": [
    {
      "name": "Step Name",
      "description": "What this step does",
      "type": "collection|analysis|review|notification|custom",
      "config": {}
    }
  ]
}

Only return the JSON, no additional text.`;

export async function parseWorkflowFromNL(userInput: string): Promise<ParsedWorkflow> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed as ParsedWorkflow;
  } catch (error) {
    console.error('Error parsing workflow:', error);
    throw error;
  }
}

export async function suggestNextStep(
  currentSteps: ParsedWorkflowStep[],
  context: string
): Promise<ParsedWorkflowStep> {
  const stepsDescription = currentSteps
    .map((s, i) => `${i + 1}. ${s.name} (${s.type}): ${s.description}`)
    .join('\n');

  const prompt = `Current workflow steps:
${stepsDescription || 'No steps yet'}

Context: ${context}

Suggest the next logical step for this laboratory workflow. Return a single step as JSON:
{
  "name": "Step Name",
  "description": "What this step does",
  "type": "collection|analysis|review|notification|custom",
  "config": {}
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content) as ParsedWorkflowStep;
}

export default openai;
