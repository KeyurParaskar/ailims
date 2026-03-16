import OpenAI from 'openai';
import { LLMProvider, LLMMessage, LLMCompletionOptions } from './index';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client || !process.env.OPENAI_API_KEY) {
      return false;
    }
    try {
      // Quick check - just verify the API key is valid
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const completion = await this.client.chat.completions.create({
      model: options?.model || 'gpt-3.5-turbo',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }
}
