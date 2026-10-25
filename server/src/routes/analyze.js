import express from 'express';
import { runVerificationPipeline } from '../services/evidenceEngine.js';
import { analyzeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', analyzeLimiter, async (req, res) => {
  try {
    const { headline, content, publisher, publicationDate, url, inputMode } = req.body;

    // Optional client-supplied API key overrides (for testing in UI or user-managed keys)
    const apiKeys = {
      geminiKey: req.headers['x-gemini-key'] || req.body.geminiKey || null,
      factCheckKey: req.headers['x-factcheck-key'] || req.body.factCheckKey || null,
      newsApiKey: req.headers['x-newsapi-key'] || req.body.newsApiKey || null
    };

    const dossier = await runVerificationPipeline({
      headline,
      content,
      publisher,
      publicationDate,
      url,
      inputMode: inputMode || 'manual',
      apiKeys
    });

    return res.json({
      success: true,
      data: dossier
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Fact-checking analysis failed.'
    });
  }
});

export default router;
