import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { llmService } from '../services/llm';
import { OllamaProvider, RECOMMENDED_MODELS } from '../services/llm/ollama-provider';

const router = Router();

// Get LLM status and available providers
router.get('/status', async (req: Request, res: Response) => {
  try {
    const providers = await llmService.getAvailableProviders();
    const activeProvider = llmService.getActiveProvider();

    res.json({
      activeProvider,
      providers,
      message:
        providers.find((p) => p.name === activeProvider && p.available)
          ? `Using ${activeProvider} provider`
          : 'Active provider unavailable, will use fallback',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get LLM status' });
  }
});

// Switch LLM provider (admin only)
router.post('/provider', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { provider } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Provider name required' });
  }

  try {
    llmService.setProvider(provider);
    res.json({
      success: true,
      activeProvider: provider,
      message: `Switched to ${provider} provider`,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get Ollama-specific info (available models, etc.)
router.get('/ollama/models', async (req: Request, res: Response) => {
  try {
    const ollama = new OllamaProvider();
    const available = await ollama.isAvailable();

    if (!available) {
      return res.json({
        available: false,
        message: 'Ollama is not running. Install from https://ollama.ai and start the service.',
        recommendedModels: RECOMMENDED_MODELS,
        installedModels: [],
      });
    }

    const installedModels = await ollama.getAvailableModels();

    res.json({
      available: true,
      installedModels,
      recommendedModels: RECOMMENDED_MODELS.map((m) => ({
        ...m,
        installed: installedModels.includes(m.name),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Ollama models' });
  }
});

// Pull a model (admin only)
router.post('/ollama/pull', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { model } = req.body;

  if (!model) {
    return res.status(400).json({ error: 'Model name required' });
  }

  try {
    const ollama = new OllamaProvider();
    const available = await ollama.isAvailable();

    if (!available) {
      return res.status(400).json({
        error: 'Ollama is not running',
        message: 'Install from https://ollama.ai and start the service',
      });
    }

    // Start pull in background
    res.json({
      success: true,
      message: `Started pulling model: ${model}`,
      note: 'This may take several minutes depending on model size',
    });

    // Pull model async (don't await)
    ollama.pullModel(model).catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start model pull' });
  }
});

// Test LLM with a simple prompt
router.post('/test', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  try {
    const startTime = Date.now();

    const response = await llmService.complete([
      { role: 'system', content: 'You are a helpful assistant. Keep responses brief.' },
      { role: 'user', content: prompt },
    ]);

    const duration = Date.now() - startTime;

    res.json({
      provider: llmService.getActiveProvider(),
      response,
      durationMs: duration,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'LLM request failed',
      message: error.message,
    });
  }
});

// Get provider setup instructions
router.get('/setup', (req: Request, res: Response) => {
  res.json({
    openai: {
      name: 'OpenAI',
      description: 'Cloud-based GPT models',
      setup: [
        '1. Sign up at https://platform.openai.com',
        '2. Generate an API key',
        '3. Set OPENAI_API_KEY in .env file',
        '4. Restart the server',
      ],
      envVars: ['OPENAI_API_KEY'],
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      pricing: 'Pay per token',
    },
    ollama: {
      name: 'Ollama (Local)',
      description: 'Run open-source LLMs locally',
      setup: [
        '1. Download from https://ollama.ai',
        '2. Install and run Ollama',
        '3. Pull a model: ollama pull llama2',
        '4. Optionally set OLLAMA_BASE_URL and OLLAMA_MODEL in .env',
      ],
      envVars: ['OLLAMA_BASE_URL', 'OLLAMA_MODEL'],
      models: RECOMMENDED_MODELS.map((m) => m.name),
      pricing: 'Free (runs locally)',
    },
    mock: {
      name: 'Mock Provider',
      description: 'Template-based responses for testing',
      setup: ['No setup required - always available as fallback'],
      envVars: [],
      models: [],
      pricing: 'Free',
    },
  });
});

export default router;
