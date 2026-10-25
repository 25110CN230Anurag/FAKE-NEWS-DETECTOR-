import express from 'express';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    platform: 'TruthLens AI Verification Core',
    version: '1.0.0',
    capabilities: {
      ssrfProtection: true,
      mozillaReadability: true,
      googleFactCheckApi: Boolean(process.env.GOOGLE_FACTCHECK_API_KEY || process.env.GEMINI_API_KEY),
      newsApi: Boolean(process.env.NEWS_API_KEY),
      rssFallback: true,
      geminiAi: Boolean(process.env.GEMINI_API_KEY),
      ruleBasedConsensusEngine: true
    }
  });
});

export default router;
