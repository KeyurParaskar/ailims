import { LLMProvider, LLMMessage, LLMCompletionOptions } from './index';

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama2';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json() as { models?: Array<{ name: string }> };
      return data.models?.map((m) => m.name) || [];
    } catch {
      return [];
    }
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    const model = options?.model || this.defaultModel;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json() as OllamaResponse;
    return data.message.content;
  }

  // Pull a model if not available
  async pullModel(modelName: string): Promise<void> {
    console.log(`Pulling model: ${modelName}`);
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${modelName}`);
    }

    // Stream the response to track progress
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const progress = JSON.parse(line);
            if (progress.status) {
              console.log(`[${modelName}] ${progress.status}`);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }
  }
}

// Supported open-source models for LIMS use cases
export const RECOMMENDED_MODELS = [
  {
    name: 'llama2',
    description: 'Meta Llama 2 - Good general purpose model',
    size: '3.8GB',
    recommended: true,
  },
  {
    name: 'llama2:13b',
    description: 'Llama 2 13B - Better reasoning, larger context',
    size: '7.4GB',
    recommended: false,
  },
  {
    name: 'mistral',
    description: 'Mistral 7B - Fast and efficient',
    size: '4.1GB',
    recommended: true,
  },
  {
    name: 'mixtral',
    description: 'Mixtral 8x7B - High quality MoE model',
    size: '26GB',
    recommended: false,
  },
  {
    name: 'codellama',
    description: 'Code Llama - Specialized for code generation',
    size: '3.8GB',
    recommended: false,
  },
  {
    name: 'neural-chat',
    description: 'Intel Neural Chat - Optimized for conversations',
    size: '4.1GB',
    recommended: false,
  },
  {
    name: 'phi',
    description: 'Microsoft Phi-2 - Small but capable',
    size: '1.7GB',
    recommended: true,
  },
];
