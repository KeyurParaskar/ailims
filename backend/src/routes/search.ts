import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI-powered search endpoint
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    // Use OpenAI to understand search intent and generate relevant results
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a LIMS search assistant. Given a search query, determine what the user is looking for and return relevant mock results.
          
Return a JSON array of search results with this structure:
[
  {
    "type": "workflow" | "sample" | "document",
    "id": "unique-id",
    "title": "Result title",
    "description": "Brief description",
    "relevance": 0.0 to 1.0
  }
]

Generate 2-5 realistic LIMS-related results based on the query. Only return the JSON array, no additional text.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const results = JSON.parse(content);
    res.json({ success: true, results, query });
  } catch (error) {
    console.error('Search error:', error);
    // Return fallback results
    res.json({
      success: true,
      results: [
        {
          type: 'workflow',
          id: 'wf-default',
          title: 'Sample Workflow',
          description: 'Default workflow result',
          relevance: 0.5,
        },
      ],
      query: req.body.query,
    });
  }
});

// Natural language query endpoint for complex questions
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a Laboratory Information Management System (LIMS). 
Answer questions about lab workflows, samples, protocols, and general lab operations.
Be helpful, accurate, and concise. If you don't know something, say so.
Context about the current lab: ${context || 'General laboratory environment'}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content;
    res.json({ success: true, answer, question });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

export default router;
