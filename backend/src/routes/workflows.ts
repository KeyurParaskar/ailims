import { Router, Request, Response } from 'express';

const router = Router();

// In-memory storage for demo (replace with database later)
let workflows: any[] = [];

// Get all workflows
router.get('/', (req: Request, res: Response) => {
  res.json({ workflows });
});

// Get workflow by ID
router.get('/:id', (req: Request, res: Response) => {
  const workflow = workflows.find((w) => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json({ workflow });
});

// Create new workflow
router.post('/', (req: Request, res: Response) => {
  const { name, description, steps } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Workflow name is required' });
  }

  const workflow = {
    id: `wf-${Date.now()}`,
    name,
    description: description || '',
    steps: steps || [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workflows.push(workflow);
  res.status(201).json({ success: true, workflow });
});

// Update workflow
router.put('/:id', (req: Request, res: Response) => {
  const index = workflows.findIndex((w) => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  workflows[index] = {
    ...workflows[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, workflow: workflows[index] });
});

// Delete workflow
router.delete('/:id', (req: Request, res: Response) => {
  const index = workflows.findIndex((w) => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  workflows.splice(index, 1);
  res.json({ success: true, message: 'Workflow deleted' });
});

export default router;
