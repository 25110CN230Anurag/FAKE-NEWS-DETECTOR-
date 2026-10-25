import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { validateUrlForSsrf } from './ssrfValidator.js';

const FETCH_TIMEOUT_MS = 8500;
const MAX_CONTENT_LENGTH_BYTES = 5 * 1024 * 1024; // 5 MB limit

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (TruthLens News Verifier)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

/**
 * Extracts news article metadata and readable text from an external web page.
 * Enforces SSRF defense, payload size limits, and robust fallback parsers.
 */
export async function extractArticle(targetUrl) {
  // 1. SSRF and Domain Security Verification
  const ssrfCheck = await validateUrlForSsrf(targetUrl);
  if (!ssrfCheck.safe) {
    const error = new Error(`Security validation failed: ${ssrfCheck.error}`);
    error.status = 400;
    error.isSsrf = true;
    throw error;
  }

  const cleanUrl = ssrfCheck.url.toString();
  const domainName = ssrfCheck.url.hostname.replace(/^www\./i, '');

  // 2. Fetch page content with strict timeout and size limits
  let response;
  try {
    response = await axios.get(cleanUrl, {
      headers: REQUEST_HEADERS,
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_CONTENT_LENGTH_BYTES,
      maxBodyLength: MAX_CONTENT_LENGTH_BYTES,
      maxRedirects: 4,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400
    });
  } catch (err) {
    let message = 'Failed to retrieve article from the provided URL.';
    let code = 502;

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      message = 'Request timed out after 8.5 seconds. The target server may be slow or unresponsive.';
      code = 504;
    } else if (err.response?.status === 403 || err.response?.status === 401) {
      message = 'Access forbidden by target website (paywall, anti-bot shield, or authentication required).';
      code = 403;
    } else if (err.response?.status === 404) {
      message = 'Article page not found (HTTP 404). Please verify the link.';
      code = 404;
    } else if (err.message) {
      message = `Fetch error: ${err.message}`;
    }

    const fetchError = new Error(message);
    fetchError.status = code;
    fetchError.manualFallbackRequired = true;
    throw fetchError;
  }

  let html = typeof response.data === 'string' ? response.data : '';
  if (!html || html.length < 200) {
    const emptyErr = new Error('The target page returned insufficient or empty HTML content. Please paste headline & summary manually.');
    emptyErr.status = 422;
    emptyErr.manualFallbackRequired = true;
    throw emptyErr;
  }

  // 3. Cheerio metadata extraction & cleanup
  const $ = cheerio.load(html);

  // Metadata: Title
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  const docTitle = $('title').text().trim();
  const h1Title = $('h1').first().text().trim();

  // Metadata: Publisher / Site Name
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  const metaPublisher = $('meta[name="publisher"]').attr('content') || $('meta[name="author"]').attr('content');

  // Metadata: Publication Date
  const ogPubDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="publish-date"]').attr('content') ||
    $('meta[name="pubdate"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    $('time').first().text().trim();

  // Metadata: Description / Teaser
  let ogDescription =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') || '';

  // Metadata: Lead Image
  const leadImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content');

  // Clean clutter before Readability: infoboxes, sidebars, navboxes, footers, scripts, styles
  $('script, style, nav, footer, header, noscript, svg, form, iframe, aside').remove();
  $('table.infobox, .infobox, .sidebar, .navbox, table.navbox, .metadata').remove();

  // Extract a clean lead paragraph if available
  const cleanLeadP = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .find(p => p.length > 50 && !p.toLowerCase().includes('cookie') && !p.toLowerCase().includes('javascript')) || '';

  if (!ogDescription && cleanLeadP) {
    ogDescription = cleanLeadP.slice(0, 250);
  }

  const cleanedHtml = $.html();

  // 4. Primary Extraction: Mozilla Readability on cleaned HTML
  let readabilityArticle = null;
  try {
    const dom = new JSDOM(cleanedHtml, { url: cleanUrl });
    const reader = new Readability(dom.window.document, {
      charThreshold: 60,
      keepClasses: false
    });
    readabilityArticle = reader.parse();
  } catch {
    readabilityArticle = null;
  }

  // 5. Fallback Extraction: Cheerio Semantic Search
  let extractedText = readabilityArticle?.textContent?.trim() || '';
  let finalTitle = readabilityArticle?.title?.trim() || ogTitle || twitterTitle || h1Title || docTitle || '';

  if (!extractedText || extractedText.length < 150) {
    const candidateSelectors = [
      'article',
      '[itemprop="articleBody"]',
      '.article-body',
      '.story-content',
      '.entry-content',
      '.post-content',
      'main'
    ];

    let fallbackText = '';
    for (const sel of candidateSelectors) {
      const match = $(sel);
      if (match.length > 0) {
        fallbackText = match.find('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
        if (fallbackText.length > 200) break;
      }
    }

    if (!fallbackText || fallbackText.length < 100) {
      fallbackText = $('p').map((_, el) => $(el).text().trim()).get().filter(p => p.length > 30).join('\n\n');
    }

    if (fallbackText && fallbackText.length > extractedText.length) {
      extractedText = fallbackText;
    }
  }

  // If extracted text didn't begin with the clean lead paragraph, prepend it
  if (cleanLeadP && !extractedText.includes(cleanLeadP.slice(0, 40))) {
    extractedText = `${cleanLeadP}\n\n${extractedText}`;
  }

  // Clean text whitespace
  extractedText = extractedText
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // Check if extraction produced adequate material
  if (!extractedText || extractedText.length < 80) {
    const failError = new Error(
      'Could not extract readable article text. The page may require JavaScript rendering or is gated behind a paywall. Please paste the headline and summary manually.'
    );
    failError.status = 422;
    failError.manualFallbackRequired = true;
    failError.partialData = {
      title: finalTitle,
      publisher: ogSiteName || metaPublisher || domainName,
      url: cleanUrl
    };
    throw failError;
  }

  const words = extractedText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const finalPublisher = ogSiteName || metaPublisher || domainName;

  let formattedDate = ogPubDate || '';
  if (formattedDate) {
    const parsedDate = new Date(formattedDate);
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = parsedDate.toISOString().split('T')[0];
    }
  }

  return {
    success: true,
    url: cleanUrl,
    domain: domainName,
    title: finalTitle || 'Untitled Article',
    publisher: finalPublisher,
    publishedDate: formattedDate,
    description: ogDescription?.trim() || '',
    text: extractedText,
    wordCount,
    estimatedReadTimeMinutes: readTimeMinutes,
    leadImage: leadImage || null
  };
}
