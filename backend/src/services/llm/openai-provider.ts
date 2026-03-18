import OpenAI from 'openai';
import { LLMProvider, LLMMessage, LLMCompletionOptions } from './index';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI | null = null;
  private keyPresent: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 10 && apiKey.startsWith('sk-')) {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
      this.keyPresent = true;
      console.log('[OpenAI] Provider initialized with API key');
    } else {
      console.log('[OpenAI] No valid API key found');
    }
  }

  async isAvailable(): Promise<boolean> {
    // Just check if we have a key - don't make API calls for availability check
    return this.keyPresent && this.client !== null;
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - missing API key');
    }

    console.log('[OpenAI] Sending request to GPT...');
    
    const completion = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[OpenAI] Received response');
    return content;
  }
}
