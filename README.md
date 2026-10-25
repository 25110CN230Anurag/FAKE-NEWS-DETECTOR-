# TruthLens AI — Fake News Detection & Fact-Checking Platform

> **"Don't Believe Every Headline. Verify It."**  
> *An AI-powered, multi-source evidence intelligence platform engineered to debunk falsehoods and verify news against accredited fact-checks and journalistic coverage.*

---

## 🌟 Highlights

- **Grounding Over Guesswork**: Never classifies news based merely on sensational tone, grammar, or writing style. Every verdict is grounded in verifiable evidence.
- **3 Input Verification Modes**:
  1. **Headline + Summary**: Check manual news headlines, full copy, publisher name, and publication date.
  2. **Article Link URL**: Server-side URL fetching with strict SSRF defense, Mozilla Readability parsing, and an editable preview card.
  3. **Quick Claim Check**: Check viral claims, rumours, or news-related questions with one click.
- **Accredited Fact Check Database**: Integrates directly with the **Google Fact Check Tools API** (`v1alpha1/claims:search`) to surface reviews from accredited IFCN signatories (Snopes, PolitiFact, Reuters Fact Check, AP Fact Check, FactCheck.org).
- **Multi-Source News Cross-Referencing**: Queries **NewsAPI** and high-reliability live RSS feeds (Reuters, AP, BBC, NPR) to evaluate consensus across global media.
- **AI Synthesis**: Powered by **Google Gemini 1.5/2.0 Flash** with strict anti-hallucination guardrails and an intelligent rule-based consensus fallback.
- **5-Tier Standardized Verdict Protocol**:
  - `Likely True`
  - `Likely False`
  - `Misleading / Partly True`
  - `Conflicting Evidence`
  - `Unverified` (displayed whenever evidence is insufficient)
- **Live News Stream**: Real-time categorized news feed with 1-click *"Verify with TruthLens"* feature.
- **Exportable Dossier**: One-click PDF export, print styling, and copyable JSON dossier.
- **Hardened Security**: Server-side DNS resolution, rejection of loopback/private RFC1918 CIDRs, link-local metadata protection, rate limiting, and Helmet security headers.

---

## 🏗️ Architecture & Technology Stack

```
                             ┌────────────────────────────────────────┐
                             │       TruthLens AI Client (Vite)       │
                             │  React 18 • TypeScript • Tailwind CSS  │
                             └──────────────────┬─────────────────────┘
                                                │ REST / JSON (SSRF-Safe)
                                                ▼
                             ┌────────────────────────────────────────┐
                             │       TruthLens Express Backend        │
                             │   Node.js • Helmet • Rate-Limiter      │
                             └───────┬──────────┬──────────┬──────────┘
                                     │          │          │
                 ┌───────────────────┘          │          └───────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │  Google Fact Check API  │    │  NewsAPI & Live RSS     │    │   Google Gemini Flash   │
    │  Snopes, PolitiFact,    │    │  Reuters, AP, BBC,      │    │   Deep Evidence         │
    │  Reuters Fact Check     │    │  Global Wire Feeds      │    │   Synthesis Engine      │
    └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

### Frontend (`client/`)
- **React 18** with **TypeScript** and **Vite**
- **Tailwind CSS** with Dark Navy design system (`#070b14`), electric blue (`#3b82f6`) and violet accents
- **Lucide React** icons
- Local persistence for verification history and user API keys

### Backend (`server/`)
- **Node.js** with **Express** (ES Modules)
- **Mozilla Readability** & **JSDOM** for clean article body extraction
- **Cheerio** for OpenGraph/Twitter Cards/JSON-LD metadata and semantic fallbacks
- **Custom SSRF Validator** enforcing IP pre-resolution and blocking private/link-local ranges
- **Google Fact Check Tools API** client
- **NewsAPI** & **Real-time RSS** multi-channel search
- **Google Gemini Flash** REST integration with structured JSON outputs

---

## 🔒 Security & SSRF Defense

When users submit an article link (Tab B), TruthLens protects the server from Server-Side Request Forgery (SSRF) and DNS rebinding attacks:
1. **Protocol Check**: Only `http:` and `https:` URLs are accepted.
2. **Hostname Blocking**: Rejects `localhost`, `.local`, `.internal`, and `.lan`.
3. **DNS Pre-Resolution**: Resolves hostname via `dns.lookup({ all: true })`.
4. **IP Range Verification**: Rejects any resolved IP in:
   - `127.0.0.0/8` (Loopback)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
   - `169.254.0.0/16` (Link-local & AWS metadata `169.254.169.254`)
   - `::1`, `fc00::/7`, `fe80::/10` (IPv6 loopback/link-local/ULA)
5. **Payload Limiting**: Max 5 MB content length and 8.5-second timeout.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.19.0)
- **npm**: v9+

### 1. Clone or Open the Repository
```bash
cd C:\Users\xproo\Desktop\TruthLens-AI
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Configure API Keys (Optional but Recommended)
Copy `.env.example` in `server/` to `server/.env`:
```bash
cd server
cp .env.example .env
```
Open `server/.env` and insert your keys:
```ini
PORT=5000
NODE_ENV=development

# 1. Google Gemini Key (Free at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Google Fact Check Key (Free; shares key with Google Cloud / Gemini)
GOOGLE_FACTCHECK_API_KEY=your_google_factcheck_api_key_here

# 3. NewsAPI Key (Free developer tier at https://newsapi.org/)
# If empty, TruthLens automatically falls back to free live RSS feeds!
NEWS_API_KEY=your_news_api_key_here
```
> *Note: You can also enter API keys directly into the web UI via the **Settings** modal, where keys are saved in local storage!*

### 4. Run the Full Application
```bash
# From the project root:
npm run dev
```
This boots both services concurrently:
- **Client (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Server (Backend API)**: [http://localhost:5000](http://localhost:5000)
- **Server Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🧪 Testing

TruthLens AI includes a full test suite verifying SSRF prevention, rating normalization, keyword extraction, and evidence consensus logic:

```bash
npm run test
```
**Test Results:**
```
--- TruthLens AI Backend Test Suite ---

1. SSRF Defense & URL Validation Tests:
  ✓ Should block localhost
  ✓ Should block 127.0.0.1 loopback
  ✓ Should block AWS cloud metadata link-local IP 169.254.169.254
  ✓ Should block private RFC1918 subnet 192.168.x.x
  ✓ Should reject non-HTTP protocols (e.g. ftp://)
  ✓ Should allow safe public URL (wikipedia.org)

2. Fact-Checker Rating Normalizer Tests:
  ✓ Normalizes "False" and "Pants on Fire" to Likely False
  ✓ Normalizes "True" and "Correct" to Likely True
  ✓ Normalizes "Mostly False" and "Misleading" to Misleading / Partly True
  ✓ Normalizes unrated/unknown to Unverified

3. Keyword Extraction Tests:
  ✓ Strips stopwords and extracts primary entities

4. Grounding & Evidence Engine Consensus Tests:
  ✓ Forces verdict to Likely False when authoritative debunk exists
  ✓ Assigns "Unverified" when no fact checks and no news coverage exist (anti-hallucination)

5. Live News Feed Tests:
  ✓ Live news service successfully retrieves real-time headlines

Tests Completed: 14 passed, 0 failed
```

---

## 📋 Standardized Verdict Reference

| Verdict | Meaning | Grounding Requirement |
| :--- | :--- | :--- |
| **Likely True** | Verified factual claims | Multiple credible primary wire services or accredited fact-checkers confirm the claim with documentation. |
| **Likely False** | Fabricated or debunked | Authoritative debunk from Snopes, PolitiFact, Reuters, or primary records showing falsification. |
| **Misleading / Partly True** | Exaggerated or out of context | References a real event or statistic, but quotes figures inaccurately, omits crucial caveats, or conflates separate events. |
| **Conflicting Evidence** | Disputed reporting | Reputable wire agencies or official entities publish mutually exclusive accounts of the story. |
| **Unverified** | Insufficient documentation | No matching fact checks or credible news reports exist. TruthLens refuses to hallucinate a verdict. |

---

## 🎓 Academic Capstone Disclaimer

**TruthLens AI** is developed as a senior college engineering project in full-stack web engineering, cybersecurity (SSRF mitigation), and applied AI for information verification. While TruthLens queries verified records from accredited IFCN signatories via the Google Fact Check Tools API, it is **not an official news agency, judicial body, or legal authority**.
