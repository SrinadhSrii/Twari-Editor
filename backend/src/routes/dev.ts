import express, { Request, Response, NextFunction } from 'express';
import db from '../utils/database';

const router = express.Router();

// POST /dev/clear
router.post('/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    console.log('🧹 Clearing all data...');
    
    // Clear all authorization data
    await db.clearAllAuthorizations();
    
    console.log('✅ All data cleared successfully');
    
    res.json({ 
      success: true, 
      message: 'All authorization data cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ 
      error: 'Failed to clear data',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;