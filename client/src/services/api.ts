import {
  ArticleExtractData,
  VerificationDossier,
  ApiStatus,
  InputMode
} from '../types';

const RAW_API_URL = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';
const HISTORY_STORAGE_KEY = 'truthlens_verification_history_v1';
const API_KEYS_STORAGE_KEY = 'truthlens_custom_api_keys_v1';

export interface StoredApiKeys {
  geminiKey: string;
  factCheckKey: string;
  newsApiKey: string;
}

export function getStoredApiKeys(): StoredApiKeys {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { geminiKey: '', factCheckKey: '', newsApiKey: '' };
  } catch {
    return { geminiKey: '', factCheckKey: '', newsApiKey: '' };
  }
}

export function saveStoredApiKeys(keys: StoredApiKeys) {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save API keys to local storage:', err);
  }
}

function getRequestHeaders(): Record<string, string> {
  const keys = getStoredApiKeys();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (keys.geminiKey) headers['x-gemini-key'] = keys.geminiKey;
  if (keys.factCheckKey) headers['x-factcheck-key'] = keys.factCheckKey;
  if (keys.newsApiKey) headers['x-newsapi-key'] = keys.newsApiKey;
  return headers;
}

/**
 * Extracts news article metadata and content via SSRF-protected backend.
 */
export async function extractArticleFromUrl(url: string): Promise<ArticleExtractData> {
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ url })
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    const error = new Error(json.error || 'Failed to extract article.');
    (error as unknown as { manualFallbackRequired?: boolean }).manualFallbackRequired = json.manualFallbackRequired;
    (error as unknown as { partialData?: Partial<ArticleExtractData> }).partialData = json.partialData;
    throw error;
  }

  return json.data;
}

/**
 * Submits news story, URL, or claim for evidence-grounded verification.
 */
export async function verifyNewsItem(payload: {
  headline: string;
  content: string;
  publisher?: string;
  publicationDate?: string;
  url?: string;
  inputMode: InputMode;
}): Promise<VerificationDossier> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Verification pipeline encountered an error.');
  }

  const dossier: VerificationDossier = json.data;
  saveToHistory(dossier);
  return dossier;
}

/**
 * Fetches real-time headlines for the Live News feed.
 */
export async function fetchLiveNewsHeadlines(category = 'general') {
  const response = await fetch(`${API_BASE}/live-news?category=${encodeURIComponent(category)}`, {
    headers: getRequestHeaders()
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to retrieve live headlines.');
  }

  return json.articles || [];
}

/**
 * Fetches backend platform status and active integrations.
 */
export async function fetchSystemStatus(): Promise<ApiStatus> {
  const response = await fetch(`${API_BASE}/config/status`);
  const json = await response.json();
  return json;
}

/**
 * Local History Management
 */
export function getHistory(): VerificationDossier[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(dossier: VerificationDossier) {
  try {
    const history = getHistory();
    // Prepend new item and avoid duplicates by id
    const filtered = history.filter(item => item.id !== dossier.id);
    const updated = [dossier, ...filtered].slice(0, 30); // Keep last 30
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save to local history:', err);
  }
}

export function deleteHistoryItem(id: string): VerificationDossier[] {
  try {
    const history = getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllHistory() {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear history:', err);
  }
}
