import crypto from 'crypto';
import { searchFactChecks } from './googleFactCheck.js';
import { searchRelatedNews } from './newsApi.js';
import { analyzeWithGemini } from './geminiAnalyzer.js';

/**
 * Master Verification Pipeline for TruthLens AI.
 * Coordinates multi-source evidence retrieval and AI synthesis.
 */
export async function runVerificationPipeline({
  headline,
  content,
  publisher,
  publicationDate,
  url,
  inputMode = 'manual',
  apiKeys = {}
}) {
  const startTime = Date.now();
  const id = `tl-${crypto.randomBytes(6).toString('hex')}`;

  const cleanHeadline = (headline || '').trim();
  const cleanContent = (content || '').trim();
  const cleanPublisher = (publisher || '').trim();
  const cleanDate = (publicationDate || '').trim();
  const cleanUrl = (url || '').trim();

  // Validate that there is at least something to verify
  if (!cleanHeadline && !cleanContent) {
    const err = new Error('Headline or text content is required for verification.');
    err.status = 400;
    throw err;
  }

  // Construct primary query for fact-checking databases
  const primaryQuery = cleanHeadline || cleanContent.slice(0, 180);

  // 1. Parallel Evidence Retrieval: Google Fact Check Tools API + News Coverage (NewsAPI/RSS)
  const factCheckApiKey = apiKeys.factCheckKey || apiKeys.geminiKey || null;
  const [factChecksResult, newsResult] = await Promise.allSettled([
    searchFactChecks(primaryQuery, factCheckApiKey),
    searchRelatedNews(primaryQuery, apiKeys.newsApiKey)
  ]);

  const factChecks = factChecksResult.status === 'fulfilled'
    ? factChecksResult.value
    : { available: false, totalClaims: 0, claims: [], error: factChecksResult.reason?.message };

  const relatedNews = newsResult.status === 'fulfilled'
    ? newsResult.value
    : { configured: false, totalResults: 0, articles: [], error: newsResult.reason?.message };

  // 2. Deep Synthesis via Google Gemini (with rule-based consensus fallback)
  const synthesis = await analyzeWithGemini(
    {
      headline: cleanHeadline,
      content: cleanContent,
      publisher: cleanPublisher,
      date: cleanDate,
      url: cleanUrl,
      factChecks,
      relatedNews
    },
    apiKeys.geminiKey
  );

  // 3. Strict Safety & Grounding Post-Processing
  // Enforce the rule: Never classify as true if accredited debunks exist
  let finalVerdict = synthesis.verdict;
  let finalConfidence = synthesis.confidenceScore;

  const hasAuthoritativeDebunk = factChecks.claims?.some(
    c => c.standardVerdict === 'Likely False'
  );
  const hasAuthoritativeConfirmation = factChecks.claims?.some(
    c => c.standardVerdict === 'Likely True'
  );

  if (hasAuthoritativeDebunk && finalVerdict === 'Likely True') {
    finalVerdict = 'Likely False';
    finalConfidence = 88;
    synthesis.summaryVerdict = `Correction Applied: Authoritative fact-checking organizations have explicitly debunked this claim. Available evidence contradicts the statement.`;
  }

  // If no external evidence was found whatsoever and synthesis claimed True/False with high confidence, clamp to Unverified
  const totalEvidenceItems = (factChecks.claims?.length || 0) + (relatedNews.articles?.length || 0);
  if (totalEvidenceItems === 0 && (finalVerdict === 'Likely True' || finalVerdict === 'Likely False')) {
    finalVerdict = 'Unverified';
    finalConfidence = 40;
    synthesis.summaryVerdict = `No corroborating news reports or fact-checks were found in credible public archives. Given the absence of verifiable proof, this story cannot be confirmed or refuted.`;
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    id,
    timestamp: new Date().toISOString(),
    processingTimeMs,
    input: {
      mode: inputMode,
      headline: cleanHeadline,
      contentSnippet: cleanContent.slice(0, 300),
      publisher: cleanPublisher || 'Unspecified',
      publicationDate: cleanDate || 'Not specified',
      url: cleanUrl || null
    },
    verdict: finalVerdict,
    confidenceScore: finalConfidence,
    summaryVerdict: synthesis.summaryVerdict,
    keyClaims: synthesis.keyClaims || [cleanHeadline],
    evidence: {
      supporting: synthesis.supportingEvidence || [],
      contradicting: synthesis.contradictingEvidence || []
    },
    factChecks: {
      totalFound: factChecks.totalClaims || 0,
      claims: factChecks.claims || [],
      warning: factChecks.warning || null
    },
    relatedCoverage: {
      provider: relatedNews.provider || 'News Archive',
      totalFound: relatedNews.articles?.length || 0,
      articles: relatedNews.articles || []
    },
    sourceComparison: synthesis.sourceComparison || {
      consensusDescription: 'Standard coverage comparison',
      wireServicesAgreement: 'Moderate'
    },
    credibilitySignals: synthesis.credibilitySignals || {
      hasAuthoritativeFactCheck: factChecks.claims?.length > 0,
      emotionalToneFlag: false,
      flags: []
    },
    limitations: synthesis.limitations || [
      'Fact-checks and indexed news may not capture breaking news events published within the last few minutes.'
    ],
    metadata: {
      engine: synthesis.engine,
      apisUsed: {
        factCheckTools: factChecks.available,
        newsApi: relatedNews.configured,
        gemini: Boolean(apiKeys.geminiKey || process.env.GEMINI_API_KEY)
      }
    }
  };
}
