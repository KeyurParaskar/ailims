import dotenv from 'dotenv';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';
import { MockProvider } from './mock-provider';

dotenv.config();

// Common interfaces for all LLM providers
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMProvider {
  name: string;
  complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
}

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

// LLM Provider configuration
type ProviderType = 'openai' | 'ollama' | 'mock';

class LLMService {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private activeProvider: ProviderType;
  private fallbackOrder: ProviderType[] = ['openai', 'ollama', 'mock'];

  constructor() {
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('mock', new MockProvider());

    // Set active provider from env or default to openai
    const envProvider = process.env.LLM_PROVIDER as ProviderType;
    this.activeProvider = envProvider || 'openai';
  }

  setProvider(provider: ProviderType): void {
    if (this.providers.has(provider)) {
      this.activeProvider = provider;
      console.log(`LLM provider set to: ${provider}`);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  getActiveProvider(): string {
    return this.activeProvider;
  }

  async getAvailableProviders(): Promise<{ name: string; available: boolean }[]> {
    const results: { name: string; available: boolean }[] = [];
    for (const [name, provider] of this.providers) {
      results.push({
        name,
        available: await provider.isAvailable(),
      });
    }
    return results;
  }

  private async getWorkingProvider(): Promise<LLMProvider> {
    // First try the active provider
    const activeProviderInstance = this.providers.get(this.activeProvider);
    if (activeProviderInstance && await activeProviderInstance.isAvailable()) {
      return activeProviderInstance;
    }

    // Fallback through the order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (provider && await provider.isAvailable()) {
        console.log(`Falling back to ${providerName} provider`);
        return provider;
      }
    }

    // Last resort: mock provider always works
    return this.providers.get('mock')!;
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    const provider = await this.getWorkingProvider();
    return provider.complete(messages, options);
  }
}

// Singleton instance
export const llmService = new LLMService();

// System prompts
const WORKFLOW_SYSTEM_PROMPT = `You are an AI assistant that helps create laboratory workflows. 
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

// High-level functions
export async function parseWorkflowFromNL(userInput: string): Promise<ParsedWorkflow> {
  try {
    const response = await llmService.complete(
      [
        { role: 'system', content: WORKFLOW_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
      { temperature: 0.7, maxTokens: 1000 }
    );

    const parsed = JSON.parse(response);
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

  const response = await llmService.complete(
    [
      { role: 'system', content: WORKFLOW_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 300 }
  );

  return JSON.parse(response) as ParsedWorkflowStep;
}

export async function searchWithNL(query: string, context: string): Promise<{
  interpretation: string;
  filters: Record<string, any>;
  suggestions: string[];
}> {
  const prompt = `User search query: "${query}"
Context: ${context}

Interpret this natural language search query for a laboratory information management system.
Return JSON with:
{
  "interpretation": "What the user is looking for",
  "filters": { "field1": "value1" },
  "suggestions": ["related search 1", "related search 2"]
}`;

  const response = await llmService.complete(
    [
      { role: 'system', content: 'You are an AI assistant helping search a laboratory database. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5, maxTokens: 500 }
  );

  return JSON.parse(response);
}
