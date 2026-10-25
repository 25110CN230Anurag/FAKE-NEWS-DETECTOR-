export type VerdictType =
  | 'Likely True'
  | 'Likely False'
  | 'Misleading / Partly True'
  | 'Unverified'
  | 'Conflicting Evidence';

export type NavigationTab = 'home' | 'check' | 'live' | 'history' | 'about';

export type InputMode = 'manual' | 'url' | 'claim';

export interface ArticleExtractData {
  success: boolean;
  url: string;
  domain: string;
  title: string;
  publisher: string;
  publishedDate: string;
  description: string;
  text: string;
  wordCount: number;
  estimatedReadTimeMinutes: number;
  leadImage: string | null;
}

export interface EvidenceItem {
  source: string;
  title: string;
  url?: string;
  date?: string | null;
  quoteOrFinding: string;
}

export interface FactCheckItem {
  id: string;
  claimText: string;
  claimant: string;
  claimDate: string | null;
  publisher: string;
  publisherSite?: string | null;
  reviewTitle: string;
  reviewUrl: string;
  reviewDate: string | null;
  textualRating: string;
  standardVerdict: VerdictType;
  polarity: number;
  badgeColor: 'red' | 'emerald' | 'amber' | 'gray';
}

export interface RelatedArticleItem {
  title: string;
  description: string;
  url: string;
  source: { id?: string | null; name: string };
  publishedAt: string;
  urlToImage?: string | null;
}

export interface VerificationDossier {
  id: string;
  timestamp: string;
  processingTimeMs: number;
  input: {
    mode: InputMode;
    headline: string;
    contentSnippet: string;
    publisher: string;
    publicationDate: string;
    url?: string | null;
  };
  verdict: VerdictType;
  confidenceScore: number;
  summaryVerdict: string;
  keyClaims: string[];
  evidence: {
    supporting: EvidenceItem[];
    contradicting: EvidenceItem[];
  };
  factChecks: {
    totalFound: number;
    claims: FactCheckItem[];
    warning?: string | null;
  };
  relatedCoverage: {
    provider: string;
    totalFound: number;
    articles: RelatedArticleItem[];
  };
  sourceComparison: {
    consensusDescription: string;
    wireServicesAgreement: string;
  };
  credibilitySignals: {
    hasAuthoritativeFactCheck: boolean;
    emotionalToneFlag: boolean;
    flags: string[];
  };
  limitations: string[];
  metadata: {
    engine: string;
    apisUsed: {
      factCheckTools: boolean;
      newsApi: boolean;
      gemini: boolean;
    };
  };
}

export interface ApiStatus {
  success: boolean;
  platform: string;
  version: string;
  capabilities: {
    ssrfProtection: boolean;
    mozillaReadability: boolean;
    googleFactCheckApi: boolean;
    newsApi: boolean;
    rssFallback: boolean;
    geminiAi: boolean;
    ruleBasedConsensusEngine: boolean;
  };
}
