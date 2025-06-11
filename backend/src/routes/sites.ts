import express, { Request, Response, NextFunction } from 'express';
import { createWebflowClient } from '../services/webflowClient';

const router = express.Router();

// GET /sites
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create a new WebflowClient with the Access Token
    const webflow = createWebflowClient(req.accessToken);
console.log(webflow);
    // Get the list of sites associated with the user
    const data = await webflow.sites.list();

    res.json({ data });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;