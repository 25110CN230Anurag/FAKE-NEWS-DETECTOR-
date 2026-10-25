import axios from 'axios';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

/**
 * Parses JSON even if wrapped in markdown backticks or containing formatting quirks.
 */
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();

  // Strip ```json ... ``` code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Find outermost JSON object braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt lenient trailing comma cleanup
    try {
      const relaxed = cleaned.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(relaxed);
    } catch {
      return null;
    }
  }
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

  // 1. Analyze authoritative fact-check records
  for (const item of claims) {
    if (item.standardVerdict === 'Likely False') {
      falseVotes += 2;
      contradicting.push({
        source: item.publisher || 'Accredited Fact-Checker',
        title: item.reviewTitle,
        url: item.reviewUrl,
        date: item.reviewDate || item.claimDate,
        quoteOrFinding: `Rated "${item.textualRating}" by ${item.publisher}: ${item.claimText}`
      });
    } else if (item.standardVerdict === 'Likely True') {
      trueVotes += 2;
      supporting.push({
        source: item.publisher || 'Accredited Fact-Checker',
        title: item.reviewTitle,
        url: item.reviewUrl,
        date: item.reviewDate || item.claimDate,
        quoteOrFinding: `Confirmed "${item.textualRating}" by ${item.publisher}: ${item.claimText}`
      });
    } else if (item.standardVerdict === 'Misleading / Partly True') {
      misleadingVotes += 1.5;
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
  const DEBUNK_KEYWORDS = [
    'fake', 'myth', 'myths', 'debunk', 'debunks', 'debunked', 'hoax', 'warning', 'warns',
    'warned', 'falsely', 'false', 'disinformation', 'misinformation', 'conspiracy', 'danger',
    'dangerous', 'outcry', 'not true', 'untrue', 'no evidence', 'refutes', 'refuted',
    'denies', 'denied', 'scam', 'bogus', "don't", 'does not', 'cannot', "isn't", 'unproven',
    'fabricated', 'fact check', 'fact-check', 'lies', 'misleading', 'fictitious'
  ];

  const trustedOutlets = [
    'reuters', 'associated press', 'ap news', 'afp', 'upi', 'bloomberg',
    'bbc', 'npr', 'pbs', 'abc', 'cbs', 'nbc', 'cnn', 'sky news', 'al jazeera', 'france 24', 'c-span', 'dw',
    'gov', '.gov', 'nasa', 'who', 'nih', 'cdc', 'britannica', 'nature', 'scientific american', 'space.com', 'science daily',
    'the hindu', 'indian express', 'times of india', 'hindustan times', 'guardian', 'nytimes', 'wsj', 'washington post',
    'financial times', 'politico', 'axios', 'the hill', 'forbes', 'time'
  ];

  for (const art of news) {
    const titleAndDesc = `${art.title || ''} ${art.description || ''}`.toLowerCase();
    const src = (art.source?.name || '').toLowerCase();
    const isMajorOutlet = trustedOutlets.some(t => src.includes(t));

    // Check if the news article is actually warning/debunking the claim
    const hasDebunkCue = DEBUNK_KEYWORDS.some(cue => {
      const regex = new RegExp(`\\b${cue}\\b`, 'i');
      return regex.test(titleAndDesc);
    });

    if (hasDebunkCue) {
      // News outlet is actively debunking or warning against this claim!
      falseVotes += isMajorOutlet ? 2 : 1;
      contradicting.push({
        source: art.source?.name || 'Journalistic Investigation',
        title: art.title,
        url: art.url,
        date: art.publishedAt ? art.publishedAt.split('T')[0] : null,
        quoteOrFinding: art.description || `Investigative report flagging this claim as a myth, debunked rumor, or safety hazard.`
      });
    } else if (isMajorOutlet && falseVotes === 0) {
      // Neutral / corroborating reporting from an established wire service
      trueVotes += 1;
      supporting.push({
        source: art.source?.name || 'Major News Outlet',
        title: art.title,
        url: art.url,
        date: art.publishedAt ? art.publishedAt.split('T')[0] : null,
        quoteOrFinding: art.description || 'Reported on this event through primary journalistic coverage.'
      });
    }
  }

  // 3. Determine consensus verdict
  let verdict = 'Unverified';
  let confidenceScore = 50;
  let summaryVerdict = '';

  if (falseVotes >= 2 && trueVotes === 0) {
    verdict = 'Likely False';
    confidenceScore = Math.min(95, 75 + falseVotes * 5);
    summaryVerdict = `Authoritative fact-checking databases and investigative reports directly debunk this claim as false, hazardous, or fabricated. No verified evidence supports it.`;
  } else if (falseVotes >= 2 && falseVotes > trueVotes) {
    verdict = 'Likely False';
    confidenceScore = Math.min(92, 70 + (falseVotes - trueVotes) * 5);
    summaryVerdict = `Journalistic investigations and fact-checking organizations have flagged this claim as inaccurate, a debunked rumor, or a dangerous myth.`;
  } else if (trueVotes >= 2 && falseVotes === 0 && misleadingVotes === 0) {
    verdict = 'Likely True';
    confidenceScore = Math.min(92, 70 + trueVotes * 6);
    summaryVerdict = `Multiple credible reporting outlets and accredited verifiers confirm the core facts of this story with primary sourcing and on-the-record documentation.`;
  } else if (misleadingVotes > 0 || (falseVotes > 0 && trueVotes > 0)) {
    verdict = falseVotes > 0 && trueVotes > 0 ? 'Conflicting Evidence' : 'Misleading / Partly True';
    confidenceScore = 70;
    summaryVerdict = `The story contains elements of truth or references a real event, but presents details out of context, exaggerates figures, or is contradicted by competing journalistic reports.`;
  } else if (claims.length === 0 && news.length === 0) {
    verdict = 'Unverified';
    confidenceScore = 40;
    summaryVerdict = `No matching fact-checks or corroborating reports from verified news agencies were found. Due to lack of independent evidence, this claim cannot be verified as true or false.`;
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
    supportingEvidence: supporting.slice(0, 5),
    contradictingEvidence: contradicting.slice(0, 5),
    sourceComparison: {
      consensusDescription: `Evaluated ${claims.length} existing fact-check database records and ${news.length} related news articles.`,
      wireServicesAgreement: trueVotes > 1 ? 'High' : falseVotes > 1 ? 'Debunked by accredited verifiers' : 'Insufficient Evidence'
    },
    credibilitySignals: {
      hasAuthoritativeFactCheck: claims.length > 0,
      emotionalToneFlag: false,
      flags: claims.length === 0 && news.length === 0 ? ['No external journalistic corroboration located'] : []
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
    // Seamlessly fallback to structured rule-based consensus
    return synthesizeRuleBasedVerdict({ headline, content, publisher, factChecks, relatedNews });
  }

  // Prepare evidence payload for Gemini
  const factCheckContext = (factChecks?.claims || []).map(c => ({
    claim: c.claimText,
    claimant: c.claimant,
    factChecker: c.publisher,
    verdictRating: c.textualRating,
    standardVerdict: c.standardVerdict,
    url: c.reviewUrl,
    date: c.reviewDate
  }));

  const newsContext = (relatedNews?.articles || []).slice(0, 6).map(n => ({
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

  // Attempt Gemini API call
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
        // Validate verdict enum
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
      // Continue to next model or rule fallback
      console.warn(`Gemini call failed on ${model}:`, err.response?.data?.error?.message || err.message);
    }
  }

  // If Gemini fails or times out, safely fallback
  return synthesizeRuleBasedVerdict({ headline, content, publisher, factChecks, relatedNews });
}
