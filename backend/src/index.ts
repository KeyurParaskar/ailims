import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai';
import workflowRoutes from './routes/workflows';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AI-LIMS API is running' });
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/workflows', workflowRoutes);

// Welcome route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to AI-LIMS API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
