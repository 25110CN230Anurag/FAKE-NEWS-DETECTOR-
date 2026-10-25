import axios from 'axios';

const FACTCHECK_ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

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
    r.includes('inaccurate')
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
 * Searches the Google Fact Check Tools API for previously vetted claims.
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

  if (!apiKey) {
    return {
      available: false,
      searched: false,
      totalClaims: 0,
      claims: [],
      warning: 'Google Fact Check API key is not configured. Falling back to multi-source cross-referencing.'
    };
  }

  // Clean and prepare query (truncate excessively long text to first 250 characters of key phrases)
  const cleanQuery = query
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

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

    // Compute consensus score from reviews
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
    const status = err.response?.status;
    let errorMsg = `Fact Check API error: ${err.message}`;

    if (status === 400) {
      errorMsg = 'Bad request to Google Fact Check API. Please check query formatting.';
    } else if (status === 403) {
      errorMsg = 'Invalid or unauthorized Google Fact Check API key, or Fact Check API is not enabled in Google Cloud Console.';
    } else if (status === 429) {
      errorMsg = 'Fact Check API rate limit exceeded.';
    }

    return {
      available: false,
      searched: true,
      query: cleanQuery,
      totalClaims: 0,
      claims: [],
      error: errorMsg
    };
  }
}
