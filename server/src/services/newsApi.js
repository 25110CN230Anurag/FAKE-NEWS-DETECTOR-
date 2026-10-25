import axios from 'axios';
import * as cheerio from 'cheerio';

const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';
const NEWS_API_TOP_ENDPOINT = 'https://newsapi.org/v2/top-headlines';

/**
 * Strips editorial prefixes and trailing publisher markers from headline strings.
 * e.g., "Breaking News: NASA confirms mission - CNN" -> "NASA confirms mission"
 */
export function cleanHeadlineText(text) {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip leading prefixes: "Breaking:", "Exclusive:", "LIVE:", etc.
  cleaned = cleaned.replace(
    /^(?:breaking(?:\s+news)?|exclusive|fact\s*check|live(?:\s+updates)?|special\s+report|watch|opinion|analysis|explained):\s*/i,
    ''
  );

  // Strip trailing publisher suffixes: " - BBC News", " | CNN", " : Reuters"
  cleaned = cleaned.replace(/\s+(?:-|\||–|—|:)\s+[^-\|:–—]+$/, '');

  return cleaned.trim();
}

/**
 * Builds an optimal search query from headline and content:
 * - If headline is 4-14 words, uses the cleaned headline directly.
 * - If headline is very short (<4 words), combines with the first sentence of content.
 * - Strips common stopwords while retaining key nouns, entities, and claim predicates.
 */
export function extractKeywords(text, content = '') {
  if (!text && !content) return '';

  const stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
    'with', 'says', 'said', 'claims', 'reported', 'reports', 'new', 'after', 'about',
    'this', 'these', 'those', 'what', 'when', 'where', 'who', 'why', 'how', 'breaking',
    'do', 'did', 'does', 'have', 'had', 'been', 'can', 'could', 'should', 'would', 'may', 'might'
  ]);

  const cleanHead = cleanHeadlineText(text);
  const headWords = cleanHead.split(/\s+/).filter(Boolean);

  // If headline is a solid phrase (4 to 14 words), the cleaned headline itself is the best search query
  if (headWords.length >= 4 && headWords.length <= 14) {
    return cleanHead;
  }

  // If headline is very short (< 4 words), extract the first sentence of content
  let combined = cleanHead;
  if (headWords.length < 4 && content) {
    const firstSentence = content.split(/[.!?]\s+/)[0] || '';
    combined = `${cleanHead} ${firstSentence}`;
  }

  // Extract up to 8 informative unique words
  const words = combined
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  const unique = Array.from(new Set(words));
  return unique.slice(0, 8).join(' ');
}

/**
 * Fallback to Google News RSS feed when NewsAPI key is not configured or fails.
 * Free, real-time, and does not require an API key.
 */
async function fetchGoogleNewsRss(query) {
  try {
    const encoded = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TruthLens/1.0'
      },
      timeout: 6000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles = [];

    $('item').each((i, el) => {
      if (i >= 8) return false;
      const title = $(el).find('title').text() || '';
      const link = $(el).find('link').text() || '';
      const pubDate = $(el).find('pubDate').text() || '';
      const source = $(el).find('source').text() || 'News Outlet';
      const descHtml = $(el).find('description').text() || '';
      const snippet = cheerio.load(descHtml).text().trim();

      articles.push({
        title,
        description: snippet || title,
        url: link,
        source: { id: null, name: source },
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        urlToImage: null
      });
    });

    return {
      success: true,
      provider: 'Google News RSS (Free Fallback)',
      totalResults: articles.length,
      articles
    };
  } catch (err) {
    return {
      success: false,
      provider: 'Google News RSS',
      totalResults: 0,
      articles: [],
      error: err.message
    };
  }
}

/**
 * Searches for related coverage across global news outlets.
 * Uses NewsAPI when key is available; seamlessly falls back to RSS search.
 */
export async function searchRelatedNews(query, overrideKey = null, contentContext = '') {
  const apiKey = overrideKey || process.env.NEWS_API_KEY;
  const cleanKeywords = extractKeywords(query, contentContext) || query.slice(0, 100);

  if (!cleanKeywords) {
    return {
      configured: Boolean(apiKey),
      searched: false,
      totalResults: 0,
      articles: []
    };
  }

  // 1. If NewsAPI key is provided, try NewsAPI first
  if (apiKey) {
    try {
      const response = await axios.get(NEWS_API_ENDPOINT, {
        params: {
          q: cleanKeywords,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 8,
          apiKey
        },
        timeout: 7000
      });

      const articles = response.data?.articles || [];
      if (articles.length > 0) {
        return {
          configured: true,
          provider: 'NewsAPI',
          searched: true,
          totalResults: response.data?.totalResults || articles.length,
          articles: articles.map(art => ({
            title: art.title || 'Untitled',
            description: art.description || '',
            url: art.url || '#',
            source: art.source || { name: 'Unknown' },
            publishedAt: art.publishedAt || '',
            urlToImage: art.urlToImage || null
          }))
        };
      }
    } catch {
      // NewsAPI failed or returned 0 -> fallback to RSS search
    }
  }

  // 2. Free RSS Search with Primary Query
  let rssResult = await fetchGoogleNewsRss(cleanKeywords);

  // 3. If primary query returned 0 results, retry with raw cleaned headline
  if (rssResult.totalResults === 0 && query !== cleanKeywords) {
    const rawClean = cleanHeadlineText(query);
    if (rawClean && rawClean !== cleanKeywords) {
      rssResult = await fetchGoogleNewsRss(rawClean);
    }
  }

  return {
    configured: Boolean(apiKey),
    provider: rssResult.provider,
    searched: true,
    totalResults: rssResult.totalResults,
    articles: rssResult.articles
  };
}

/**
 * Retrieves top headlines for the Live News feed.
 */
export async function fetchLiveHeadlines(category = 'general', overrideKey = null) {
  const apiKey = overrideKey || process.env.NEWS_API_KEY;

  if (apiKey) {
    try {
      const response = await axios.get(NEWS_API_TOP_ENDPOINT, {
        params: {
          country: 'us',
          category: category === 'all' ? 'general' : category,
          pageSize: 15,
          apiKey
        },
        timeout: 7000
      });

      return {
        success: true,
        provider: 'NewsAPI',
        articles: response.data?.articles || []
      };
    } catch {
      // fallback to category RSS
    }
  }

  // Fallback to trusted public RSS feeds based on category
  const categoryRssUrls = {
    general: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    technology: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    politics: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en',
    science: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en',
    health: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en',
    world: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en'
  };

  const feedUrl = categoryRssUrls[category.toLowerCase()] || categoryRssUrls.general;

  try {
    const response = await axios.get(feedUrl, {
      headers: { 'User-Agent': 'TruthLens/1.0 NewsFeed' },
      timeout: 6000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles = [];

    $('item').each((i, el) => {
      if (i >= 15) return false;
      const title = $(el).find('title').text() || '';
      const link = $(el).find('link').text() || '';
      const pubDate = $(el).find('pubDate').text() || '';
      const source = $(el).find('source').text() || 'Verified Media';
      const descHtml = $(el).find('description').text() || '';
      const snippet = cheerio.load(descHtml).text().trim();

      articles.push({
        title,
        description: snippet || title,
        url: link,
        source: { id: null, name: source },
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        urlToImage: null
      });
    });

    return {
      success: true,
      provider: 'Verified Live Feeds',
      articles
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      articles: []
    };
  }
}
