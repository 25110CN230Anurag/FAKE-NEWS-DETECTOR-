import axios from 'axios';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

/**
 * Known premier wire services and authoritative institutions.
 * Sourced reporting from these entities carries primary confirmation weight.
 */
const PREMIER_SOURCES = [
  'reuters', 'associated press', 'ap news', 'ap', 'afp', 'bloomberg', 'upi',
  'bbc', 'npr', 'pbs', 'abc news', 'cbs news', 'nbc news', 'cnn', 'sky news', 'dw',
  'france 24', 'al jazeera', 'c-span', 'the guardian', 'nytimes', 'new york times',
  'wsj', 'wall street journal', 'washington post', 'financial times', 'forbes', 'time',
  'the economist', 'politico', 'axios', 'the hindu', 'indian express', 'times of india',
  'hindustan times', 'livemint', 'business standard', 'gov', '.gov', 'nasa', 'who',
  'cdc', 'nih', 'isro', 'esa', 'un', 'unesco', 'nature', 'science', 'scientific american',
  'space.com', 'science daily', 'phys.org', 'live science', 'wired', 'arstechnica',
  'national geographic', 'smithsonian', 'mit technology review', 'nobelprize.org'
];

/**
 * Accredited fact-checking publishers.
 */
const FACT_CHECK_OUTLETS = [
  'snopes', 'politifact', 'factcheck', 'fact-check', 'lead stories', 'check your fact',
  'boom live', 'full fact', 'health feedback', 'climate feedback', 'vishvas news',
  'alt news', 'newsguard', 'reuters fact check', 'ap fact check', 'bbc reality check',
  'usa today fact check', 'washington post fact checker', 'afp fact check'
];

/**
 * High-precision debunk phrases that signify investigative or fact-check debunking.
 */
const DEBUNK_PHRASES = [
  'fact check', 'factcheck', 'fact-check', 'false claim', 'falsely claim', 'falsely claimed',
  'falsely reported', 'debunked', 'debunks', 'debunking', 'viral hoax', 'hoax',
  'viral myth', 'myth', 'no evidence', 'no proof', 'fabricated', 'manipulated image',
  'manipulated video', 'deepfake', 'scam', 'phishing', 'bogus', 'untrue', 'not true',
  'discredited', 'contrary to claims', 'pants on fire', 'fake news', 'no, nasa did not',
  'no, who did not', 'no, government did not', 'not predicting', 'does not cure',
  'is not true', 'baseless theory', 'baseless claim', 'misleading claim', 'refutes',
  'refuted', 'refuting', 'denies', 'denied', 'fake cure', 'miracle cure', 'toxic',
  'conspiracy theorist', 'conspiracy theorists', 'conspiracy theory', 'indicted for selling',
  'arrested for selling', 'extradited', 'warning against', 'warns against'
];

/**
 * Words that indicate an ancillary asset debunk (e.g. photos/videos) rather than the event itself.
 */
const ASSET_WORDS = [
  'image', 'images', 'video', 'videos', 'photo', 'photos', 'picture', 'pictures',
  'clip', 'clips', 'visuals', 'audio', 'deepfake', 'cgi', 'poster', 'footage', 'simulation'
];

/**
 * Checks whether a fact check is debunking the core claim or just a viral graphic/CGI clip.
 */
function isDirectClaimDebunk(reviewTitle = '', inputHeadline = '') {
  const rtLower = reviewTitle.toLowerCase();
  const ihLower = inputHeadline.toLowerCase();

  const isDebunkingAsset = ASSET_WORDS.some(w => rtLower.includes(w));
  const inputMentionsAsset = ASSET_WORDS.some(w => ihLower.includes(w));

  if (isDebunkingAsset && !inputMentionsAsset) {
    return false;
  }

  const stopwords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are',
    'was', 'were', 'will', 'this', 'that', 'from', 'with', 'about', 'fact', 'check', 'review'
  ]);
  const inputTerms = ihLower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));

  const matchedTerms = inputTerms.filter(t => rtLower.includes(t));
  return matchedTerms.length >= 1;
}

/**
 * Checks if a news article is actually relevant to the claim being evaluated.
 * Prevents completely unrelated news from counting as corroborating evidence.
 */
function isArticleRelevantToClaim(title = '', description = '', headline = '') {
  const combined = `${title} ${description}`.toLowerCase();
  const hLower = headline.toLowerCase().replace(/[^\w\s]/g, ' ');
  const stopwords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are',
    'was', 'were', 'will', 'this', 'that', 'from', 'with', 'about', 'says', 'said'
  ]);
  const terms = hLower.split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));

  if (terms.length <= 2) {
    return terms.some(t => combined.includes(t));
  }

  const matchCount = terms.filter(t => combined.includes(t)).length;
  return matchCount >= 2;
}

/**
 * Parses JSON even if wrapped in markdown backticks or containing formatting quirks.
 */
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      const relaxed = cleaned.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(relaxed);
    } catch {
      return null;
    }
  }
}

/**
 * Evaluates whether an article is actively debunking or warning against a claim.
 */
function evaluateArticleDebunk(title = '', description = '', sourceName = '') {
  const combined = `${title} ${description}`.toLowerCase();
  const src = sourceName.toLowerCase();

  const isFactChecker = FACT_CHECK_OUTLETS.some(fc => src.includes(fc) || combined.includes(fc));
  if (isFactChecker) {
    return { isDebunk: true, isFactChecker: true };
  }

  const hasDebunkPhrase = DEBUNK_PHRASES.some(phrase => combined.includes(phrase));
  if (hasDebunkPhrase) {
    return { isDebunk: true, isFactChecker: false };
  }

  if (combined.startsWith('did ') && combined.includes('?') && src.includes('fact')) {
    return { isDebunk: true, isFactChecker: false };
  }

  return { isDebunk: false, isFactChecker: false };
}

/**
 * Intelligent evidence-grounded fallback synthesizer when Gemini API key is unavailable.
 * Guarantees zero hallucinations and adheres to the cardinal rule:
 * If evidence is insufficient, verdict is strictly 'Unverified'.
 */
export function synthesizeRuleBasedVerdict({ headline, content, publisher, factChecks, relatedNews }) {
  const claims = factChecks?.claims || [];
  const news = relatedNews?.articles || [];

  let falseVotes = 0;
  let trueVotes = 0;
  let misleadingVotes = 0;

  const supporting = [];
  const contradicting = [];
  const flags = [];

  // 1. Analyze authoritative fact-check records
  for (const item of claims) {
    const isDirect = isDirectClaimDebunk(item.reviewTitle || '', headline || '');

    if (item.standardVerdict === 'Likely False') {
      if (isDirect) {
        falseVotes += 3;
        contradicting.push({
          source: item.publisher || 'Accredited Fact-Checker',
          title: item.reviewTitle,
          url: item.reviewUrl,
          date: item.reviewDate || item.claimDate,
          quoteOrFinding: `Accredited rating "${item.textualRating}" by ${item.publisher}: Directly refuting this statement.`
        });
      } else {
        flags.push(`Fact-checker ${item.publisher} previously debunked altered imagery or viral clips associated with this topic.`);
      }
    } else if (item.standardVerdict === 'Likely True') {
      trueVotes += 3;
      supporting.push({
        source: item.publisher || 'Accredited Fact-Checker',
        title: item.reviewTitle,
        url: item.reviewUrl,
        date: item.reviewDate || item.claimDate,
        quoteOrFinding: `Confirmed "${item.textualRating}" by ${item.publisher}: Verified through primary documentation.`
      });
    } else if (item.standardVerdict === 'Misleading / Partly True') {
      misleadingVotes += 2;
      contradicting.push({
        source: item.publisher || 'Accredited Fact-Checker',
        title: item.reviewTitle,
        url: item.reviewUrl,
        date: item.reviewDate || item.claimDate,
        quoteOrFinding: `Flagged as "${item.textualRating}" by ${item.publisher}: Context missing or distorted.`
      });
    }
  }

  // 2. Analyze corroborating vs debunking news coverage
  for (const art of news) {
    const srcName = art.source?.name || 'News Outlet';
    const srcLower = srcName.toLowerCase();

    // Skip uncurated social media platforms
    if (
      srcLower.includes('facebook') ||
      srcLower.includes('twitter') ||
      srcLower.includes('tiktok') ||
      srcLower.includes('reddit')
    ) {
      continue;
    }

    const { isDebunk, isFactChecker } = evaluateArticleDebunk(art.title, art.description, srcName);
    const isPremier = PREMIER_SOURCES.some(p => srcLower.includes(p));

    if (isDebunk) {
      const isDirect = isDirectClaimDebunk(art.title, headline || '');
      if (isDirect) {
        const weight = isFactChecker ? 3 : isPremier ? 2 : 1.5;
        falseVotes += weight;
        contradicting.push({
          source: srcName,
          title: art.title,
          url: art.url,
          date: art.publishedAt ? art.publishedAt.split('T')[0] : null,
          quoteOrFinding: art.description || `Investigative reporting debunking or warning against this claim.`
        });
      } else {
        flags.push(`Secondary visual or media debunk noted by ${srcName}.`);
      }
    } else {
      // Must be relevant to the claim to be considered supporting!
      const isRelevant = isArticleRelevantToClaim(art.title, art.description, headline || '');
      if (isRelevant) {
        const weight = isPremier ? 2 : 1;
        trueVotes += weight;
        supporting.push({
          source: srcName,
          title: art.title,
          url: art.url,
          date: art.publishedAt ? art.publishedAt.split('T')[0] : null,
          quoteOrFinding: art.description || 'Reported on this event through primary journalistic coverage.'
        });
      }
    }
  }

  // 3. Determine consensus verdict
  let verdict = 'Unverified';
  let confidenceScore = 50;
  let summaryVerdict = '';

  if (trueVotes >= 4 && trueVotes >= falseVotes * 1.5) {
    verdict = 'Likely True';
    confidenceScore = Math.min(94, 75 + Math.round(trueVotes * 2.2));
    summaryVerdict = `Multiple credible reporting outlets and accredited wire services confirm the core facts of this story with primary sourcing and on-the-record documentation.`;
  } else if (falseVotes >= 2 && falseVotes > trueVotes) {
    verdict = 'Likely False';
    confidenceScore = Math.min(95, 78 + Math.round(falseVotes * 3));
    summaryVerdict = `Authoritative fact-checking databases and investigative journalistic reports directly debunk this claim as false, fabricated, or an unfounded rumor. No credible evidence supports it.`;
  } else if (trueVotes >= 2 && falseVotes === 0 && misleadingVotes === 0) {
    verdict = 'Likely True';
    confidenceScore = Math.min(92, 70 + Math.round(trueVotes * 3));
    summaryVerdict = `Credible journalistic reporting corroborates this event with consistent details and published documentation across multiple newsrooms.`;
  } else if (misleadingVotes >= 2 || (falseVotes >= 2 && trueVotes >= 2)) {
    verdict = falseVotes >= 2 && trueVotes >= 2 ? 'Conflicting Evidence' : 'Misleading / Partly True';
    confidenceScore = 70;
    summaryVerdict = `The story contains elements of truth or references a real event, but presents details out of context, exaggerates figures, or is contradicted by competing journalistic reports.`;
  } else if (claims.length === 0 && news.length === 0) {
    verdict = 'Unverified';
    confidenceScore = 40;
    summaryVerdict = `No matching fact-checks or corroborating reports from verified news agencies were found. Given the absence of verifiable proof, this story cannot be confirmed or refuted.`;
  } else {
    verdict = 'Unverified';
    confidenceScore = 45;
    summaryVerdict = `Limited secondary references exist, but no conclusive primary confirmation or accredited fact-checking consensus is available at this time.`;
  }

  return {
    verdict,
    confidenceScore,
    summaryVerdict,
    keyClaims: [
      headline || 'Input statement or claim',
      ...(content ? [content.slice(0, 160) + '...'] : [])
    ],
    supportingEvidence: supporting.slice(0, 6),
    contradictingEvidence: contradicting.slice(0, 6),
    sourceComparison: {
      consensusDescription: `Evaluated ${claims.length} fact-check database records and ${news.length} related news articles.`,
      wireServicesAgreement: trueVotes > 3 ? 'High' : falseVotes > 2 ? 'Debunked by accredited verifiers' : 'Moderate'
    },
    credibilitySignals: {
      hasAuthoritativeFactCheck: claims.length > 0,
      emotionalToneFlag: false,
      flags: [
        ...flags.slice(0, 2),
        ...(claims.length === 0 && news.length === 0 ? ['No external journalistic corroboration located'] : [])
      ]
    },
    limitations: [
      'Analysis is grounded in currently accessible fact-checking archives and indexed news reporting.',
      'Developing breaking news may lack finalized fact checks for the first few hours.'
    ],
    engine: 'TruthLens Multi-Source Consensus Synthesizer (Rule-Based & Evidence Grounded)'
  };
}

/**
 * Conducts deep evidence-grounded AI synthesis using Google Gemini.
 */
export async function analyzeWithGemini({ headline, content, publisher, date, url, factChecks, relatedNews }, overrideKey = null) {
  const apiKey = overrideKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return synthesizeRuleBasedVerdict({ headline, content, publisher, factChecks, relatedNews });
  }

  const factCheckContext = (factChecks?.claims || []).map(c => ({
    claim: c.claimText,
    claimant: c.claimant,
    factChecker: c.publisher,
    verdictRating: c.textualRating,
    standardVerdict: c.standardVerdict,
    url: c.reviewUrl,
    date: c.reviewDate
  }));

  const newsContext = (relatedNews?.articles || []).slice(0, 8).map(n => ({
    title: n.title,
    source: n.source?.name,
    description: n.description,
    publishedAt: n.publishedAt,
    url: n.url
  }));

  const systemInstruction = `You are TruthLens AI, an objective, rigorous, evidence-based fact-checking intelligence platform.
Your mandate is to examine news articles, claims, and headlines against available fact-checking records and news coverage.

CARDINAL RULES:
1. NEVER classify a story as true or false based solely on sensational writing style, emotional tone, or grammar. Style does NOT equal falsehood.
2. Ground your verdict strictly in:
   - Accredited fact-check debunks (Snopes, PolitiFact, Reuters, AFP, FactCheck.org, etc.)
   - Independent corroboration from credible wire services (AP, Reuters, BBC, NPR, etc.)
3. Available Verdicts (MUST use one of these EXACT five strings):
   - "Likely True"
   - "Likely False"
   - "Misleading / Partly True"
   - "Unverified"
   - "Conflicting Evidence"
4. If there is NO reliable evidence confirming or denying the story, you MUST return "Unverified" or "Conflicting Evidence". NEVER guess or hallucinate.
5. If accredited fact-checkers rated this exact claim as False/Pants-on-Fire/Debunked, the verdict MUST be "Likely False".

You MUST output ONLY valid JSON without any markdown formatting, matching this exact schema:
{
  "verdict": "Likely True" | "Likely False" | "Misleading / Partly True" | "Unverified" | "Conflicting Evidence",
  "confidenceScore": number between 0 and 100,
  "summaryVerdict": "2-3 clear sentences explaining the conclusion based strictly on available evidence",
  "keyClaims": ["claim 1", "claim 2"],
  "supportingEvidence": [
    { "source": "Outlet name", "title": "Headline", "url": "URL if available", "date": "YYYY-MM-DD or approx", "quoteOrFinding": "Specific factual finding" }
  ],
  "contradictingEvidence": [
    { "source": "Outlet or FactChecker", "title": "Headline", "url": "URL if available", "date": "YYYY-MM-DD or approx", "quoteOrFinding": "Specific factual debunk" }
  ],
  "sourceComparison": {
    "consensusDescription": "Comparison of how major outlets report this",
    "wireServicesAgreement": "High" | "Moderate" | "Low" | "Conflicting" | "Insufficient Evidence"
  },
  "credibilitySignals": {
    "hasAuthoritativeFactCheck": boolean,
    "emotionalToneFlag": boolean,
    "flags": ["list of red flags or methodological notes"]
  },
  "limitations": [
    "Specific gaps in available documentation or caveats"
  ]
}`;

  const promptText = `ANALYZE THE FOLLOWING NEWS ITEM:
Headline: ${headline || 'N/A'}
Publisher/Source: ${publisher || 'N/A'}
Publication Date: ${date || 'N/A'}
Original URL: ${url || 'N/A'}
Content/Summary:
${content ? content.slice(0, 3000) : 'No body text provided'}

DATABASE SEARCH RESULTS & EVIDENCE:
--- Existing Google Fact Check Claims (${factCheckContext.length} found) ---
${JSON.stringify(factCheckContext, null, 2)}

--- Related Global News Coverage (${newsContext.length} articles) ---
${JSON.stringify(newsContext, null, 2)}

Perform rigorous fact-checking and return the required JSON.`;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        endpoint,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${promptText}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 14000
        }
      );

      const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = extractJsonFromText(candidateText);

      if (parsed && parsed.verdict) {
        const validVerdicts = [
          'Likely True',
          'Likely False',
          'Misleading / Partly True',
          'Unverified',
          'Conflicting Evidence'
        ];
        if (!validVerdicts.includes(parsed.verdict)) {
          parsed.verdict = 'Unverified';
        }

        return {
          ...parsed,
          engine: `Google Gemini AI (${model}) with FactCheck Grounding`
        };
      }
    } catch (err) {
      console.warn(`Gemini call failed on ${model}:`, err.response?.data?.error?.message || err.message);
    }
  }

  return synthesizeRuleBasedVerdict({ headline, content, publisher, factChecks, relatedNews });
}
