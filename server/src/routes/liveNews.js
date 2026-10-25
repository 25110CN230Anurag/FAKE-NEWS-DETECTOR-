import express from 'express';
import { fetchLiveHeadlines } from '../services/newsApi.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const category = req.query.category || 'general';
    const overrideKey = req.headers['x-newsapi-key'] || null;

    const result = await fetchLiveHeadlines(category, overrideKey);

    return res.json({
      success: true,
      category,
      provider: result.provider || 'Live Feed',
      articles: result.articles || []
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch live news headlines.'
    });
  }
});

export default router;
