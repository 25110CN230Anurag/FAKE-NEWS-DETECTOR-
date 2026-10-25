import axios from 'axios';
import * as cheerio from 'cheerio';

const FACTCHECK_ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

const FACT_CHECK_OUTLETS = [
  'snopes', 'politifact', 'factcheck', 'fact-check', 'lead stories', 'check your fact',
  'boom live', 'full fact', 'health feedback', 'climate feedback', 'vishvas news',
  'alt news', 'newsguard', 'reuters fact check', 'ap fact check', 'bbc reality check',
  'usa today fact check', 'washington post fact checker', 'afp fact check'
];

/**
 * Maps textual ratings from diverse fact-check organizations (Snopes, PolitiFact, Reuters, AFP, etc.)
 * into standardized TruthLens categories:
 * - 'Likely False'
 * - 'Likely True'
 * - 'Misleading / Partly True'
 * - 'Unverified'
 */
export function normalizeRating(textualRating) {
  if (!textualRating || typeof textualRating !== 'string') {
    return { standardVerdict: 'Unverified', polarity: 0, badgeColor: 'gray' };
  }

  const r = textualRating.toLowerCase().trim();

  // Explicit False patterns
  if (
    r.includes('false') ||
    r.includes('pants on fire') ||
    r.includes('incorrect') ||
    r.includes('debunked') ||
    r.includes('fake') ||
    r.includes('fabricated') ||
    r.includes('hoax') ||
    r.includes('scam') ||
    r.includes('altered') ||
    r.includes('manipulated') ||
    r.includes('wrong') ||
    r.includes('bogus') ||
    r.includes('inaccurate') ||
    r.includes('untrue')
  ) {
    if (r.includes('mostly false') || r.includes('partly false') || r.includes('barely true')) {
      return { standardVerdict: 'Misleading / Partly True', polarity: -0.6, badgeColor: 'amber' };
    }
    return { standardVerdict: 'Likely False', polarity: -1.0, badgeColor: 'red' };
  }

  // Explicit True patterns
  if (
    r.includes('true') ||
    r.includes('correct') ||
    r.includes('accurate') ||
    r.includes('verified') ||
    r.includes('confirmed') ||
    r.includes('fact')
  ) {
    if (r.includes('mostly true') || r.includes('half true') || r.includes('partly true')) {
      return { standardVerdict: 'Misleading / Partly True', polarity: 0.5, badgeColor: 'amber' };
    }
    return { standardVerdict: 'Likely True', polarity: 1.0, badgeColor: 'emerald' };
  }

  // Misleading / Out of Context patterns
  if (
    r.includes('misleading') ||
    r.includes('out of context') ||
    r.includes('lacks context') ||
    r.includes('missing context') ||
    r.includes('exaggerated') ||
    r.includes('unsupported') ||
    r.includes('distorted')
  ) {
    return { standardVerdict: 'Misleading / Partly True', polarity: -0.4, badgeColor: 'amber' };
  }

  // Unverified / Mixture
  if (r.includes('unproven') || r.includes('unverified') || r.includes('mixture') || r.includes('disputed')) {
    return { standardVerdict: 'Unverified', polarity: 0, badgeColor: 'gray' };
  }

  return { standardVerdict: 'Unverified', polarity: 0, badgeColor: 'gray' };
}

/**
 * Fallback to searching accredited fact-check archives via Google News RSS
 * when official Google Fact Check API key is missing or returns 0 claims.
 */
async function fetchFactChecksFromRss(query) {
  try {
    const q = `${query} fact check`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TruthLens/1.0' },
      timeout: 6000
    });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const claims = [];

    $('item').each((i, el) => {
      if (claims.length >= 6) return false;
      const title = $(el).find('title').text() || '';
      const link = $(el).find('link').text() || '';
      const pubDate = $(el).find('pubDate').text() || '';
      const source = $(el).find('source').text() || '';
      const descHtml = $(el).find('description').text() || '';
      const snippet = cheerio.load(descHtml).text().trim();

      const srcLower = source.toLowerCase();
      const titleLower = title.toLowerCase();

      const isFactChecker = FACT_CHECK_OUTLETS.some(fc => srcLower.includes(fc) || titleLower.includes(fc));
      if (!isFactChecker) return;

      // Extract rating cue from title and snippet
      let rating = 'Debunked / False';
      if (titleLower.includes('true') && !titleLower.includes('not true') && !titleLower.includes('false')) {
        rating = 'Verified True';
      } else if (titleLower.includes('partly') || titleLower.includes('misleading') || titleLower.includes('context')) {
        rating = 'Misleading / Partly True';
      }

      const ratingInfo = normalizeRating(rating);

      claims.push({
        id: `fc-rss-${claims.length + 1}`,
        claimText: query,
        claimant: 'Viral social media report',
        claimDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : null,
        publisher: source || 'Accredited Fact-Checker',
        publisherSite: link,
        reviewTitle: title,
        reviewUrl: link,
        reviewDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : null,
        textualRating: rating,
        standardVerdict: ratingInfo.standardVerdict,
        polarity: ratingInfo.polarity,
        badgeColor: ratingInfo.badgeColor
      });
    });

    return {
      available: true,
      searched: true,
      query,
      provider: 'Fact-Check RSS Archives (Free Grounding)',
      totalClaims: claims.length,
      claims,
      consensusStats: {
        falseCount: claims.filter(c => c.standardVerdict === 'Likely False').length,
        trueCount: claims.filter(c => c.standardVerdict === 'Likely True').length,
        misleadingCount: claims.filter(c => c.standardVerdict === 'Misleading / Partly True').length,
        hasAuthoritativeDebunk: claims.some(c => c.standardVerdict === 'Likely False'),
        hasAuthoritativeConfirmation: claims.some(c => c.standardVerdict === 'Likely True')
      }
    };
  } catch (err) {
    return {
      available: false,
      searched: true,
      query,
      totalClaims: 0,
      claims: [],
      error: err.message
    };
  }
}

/**
 * Searches the Google Fact Check Tools API for previously vetted claims.
 * Seamlessly falls back to accredited RSS fact-checking archives if no key is configured or returns 0.
 * @param {string} query - The search query, headline, or claim
 * @param {string} [overrideKey] - Optional client-provided API key
 * @returns {Promise<Object>} Formatted fact check matches and summary statistics
 */
export async function searchFactChecks(query, overrideKey = null) {
  const apiKey = overrideKey || process.env.GOOGLE_FACTCHECK_API_KEY || process.env.GEMINI_API_KEY;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return {
      available: Boolean(apiKey),
      searched: false,
      totalClaims: 0,
      claims: [],
      error: 'Query string cannot be empty'
    };
  }

  // Clean and prepare query (truncate excessively long text to first 200 characters)
  const cleanQuery = query
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  // If no official API key configured, use free accredited RSS fact-check search
  if (!apiKey) {
    return await fetchFactChecksFromRss(cleanQuery);
  }

  try {
    const response = await axios.get(FACTCHECK_ENDPOINT, {
      params: {
        query: cleanQuery,
        languageCode: 'en',
        pageSize: 8,
        key: apiKey
      },
      timeout: 7000
    });

    const rawClaims = response.data?.claims || [];

    // If official API returns 0 claims, try free RSS fact check fallback
    if (rawClaims.length === 0) {
      const rssFallback = await fetchFactChecksFromRss(cleanQuery);
      if (rssFallback.totalClaims > 0) {
        return rssFallback;
      }
    }

    const structuredClaims = rawClaims.map((item, index) => {
      const review = (item.claimReview && item.claimReview[0]) || {};
      const ratingInfo = normalizeRating(review.textualRating);

      return {
        id: `fc-${index + 1}`,
        claimText: item.text || 'Unspecified Claim',
        claimant: item.claimant || 'Unknown source / Viral post',
        claimDate: item.claimDate ? item.claimDate.split('T')[0] : null,
        publisher: review.publisher?.name || 'Accredited Fact-Checker',
        publisherSite: review.publisher?.site || null,
        reviewTitle: review.title || review.textualRating || 'Fact Check Review',
        reviewUrl: review.url || '#',
        reviewDate: review.reviewDate ? review.reviewDate.split('T')[0] : null,
        textualRating: review.textualRating || 'Unrated',
        standardVerdict: ratingInfo.standardVerdict,
        polarity: ratingInfo.polarity,
        badgeColor: ratingInfo.badgeColor
      };
    });

    let falseCount = 0;
    let trueCount = 0;
    let misleadingCount = 0;

    for (const c of structuredClaims) {
      if (c.standardVerdict === 'Likely False') falseCount++;
      else if (c.standardVerdict === 'Likely True') trueCount++;
      else if (c.standardVerdict === 'Misleading / Partly True') misleadingCount++;
    }

    return {
      available: true,
      searched: true,
      query: cleanQuery,
      provider: 'Google Fact Check Tools API',
      totalClaims: structuredClaims.length,
      claims: structuredClaims,
      consensusStats: {
        falseCount,
        trueCount,
        misleadingCount,
        hasAuthoritativeDebunk: falseCount > 0,
        hasAuthoritativeConfirmation: trueCount > 0
      }
    };
  } catch (err) {
    // If official API encounters an error (rate limit, invalid key), fallback to RSS search
    const rssFallback = await fetchFactChecksFromRss(cleanQuery);
    if (rssFallback.totalClaims > 0) {
      return rssFallback;
    }

    return {
      available: false,
      searched: true,
      query: cleanQuery,
      totalClaims: 0,
      claims: [],
      error: `Fact Check API error: ${err.message}`
    };
  }
}
