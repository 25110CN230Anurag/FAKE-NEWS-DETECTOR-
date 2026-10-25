import axios from 'axios';
import * as cheerio from 'cheerio';

const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';
const NEWS_API_TOP_ENDPOINT = 'https://newsapi.org/v2/top-headlines';

/**
 * Extracts 2 to 5 meaningful search keywords from headline or claim text,
 * stripping common stopwords and punctuation.
 */
export function extractKeywords(text) {
  if (!text) return '';
  const stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
    'with', 'says', 'said', 'claims', 'reported', 'reports', 'new', 'after', 'about',
    'this', 'these', 'those', 'what', 'when', 'where', 'who', 'why', 'how', 'breaking',
    'do', 'did', 'does', 'have', 'had', 'been', 'can', 'could', 'should', 'would', 'may', 'might'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  // Take top 4-5 unique keywords
  const unique = Array.from(new Set(words));
  return unique.slice(0, 5).join(' ');
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
export async function searchRelatedNews(query, overrideKey = null) {
  const apiKey = overrideKey || process.env.NEWS_API_KEY;
  const cleanKeywords = extractKeywords(query) || query.slice(0, 80);

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
    } catch (err) {
      // NewsAPI failed (e.g. rate limit 429 or invalid key 401)
      // Fallback to RSS search instead of failing!
    }
  }

  // 2. Free RSS Fallback
  const rssResult = await fetchGoogleNewsRss(cleanKeywords);
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
