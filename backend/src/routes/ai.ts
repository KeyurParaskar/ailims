import { Router, Request, Response } from 'express';
import { parseWorkflowFromNL, suggestNextStep, llmService } from '../services/llm';

const router = Router();

// Parse natural language to create workflow
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required and must be a string' });
    }

    const workflow = await parseWorkflowFromNL(input);
    res.json({ 
      success: true, 
      workflow,
      provider: llmService.getActiveProvider(),
    });
  } catch (error) {
    console.error('Error parsing workflow:', error);
    res.status(500).json({ error: 'Failed to parse workflow from natural language' });
  }
});

// Suggest next step based on current workflow
router.post('/suggest-step', async (req: Request, res: Response) => {
  try {
    const { currentSteps, context } = req.body;

    if (!Array.isArray(currentSteps)) {
      return res.status(400).json({ error: 'currentSteps must be an array' });
    }

    const suggestion = await suggestNextStep(currentSteps, context || '');
    res.json({ 
      success: true, 
      step: suggestion,
      provider: llmService.getActiveProvider(),
    });
  } catch (error) {
    console.error('Error suggesting step:', error);
    res.status(500).json({ error: 'Failed to suggest next step' });
  }
});

export default router;
