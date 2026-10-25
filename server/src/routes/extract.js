import express from 'express';
import { extractArticle } from '../services/articleExtractor.js';
import { extractLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', extractLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid article URL to fetch.'
      });
    }

    const articleData = await extractArticle(url.trim());
    return res.json({
      success: true,
      data: articleData
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'An error occurred while extracting the article.',
      manualFallbackRequired: Boolean(err.manualFallbackRequired),
      isSsrf: Boolean(err.isSsrf),
      partialData: err.partialData || null
    });
  }
});

export default router;
