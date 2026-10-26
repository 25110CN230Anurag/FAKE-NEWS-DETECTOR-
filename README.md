# 🛡️ VERITAS — AI News Veracity & Real-Time Fact Verification Engine

> **Detect whether news is True or False, determine the exact percentage of truthfulness, and break down atomic claims from any web page (Times of India, NDTV, BBC, Reuters) or raw text.**

---

## 🌟 Overview & Key Features

**Veritas** is an end-to-end, multi-layered fake news detection platform. Unlike conventional binary classifiers that simply spit out a rigid "True" or "False", Veritas answers **"How much of this article is true?"** by providing an exact **Veracity Percentage (0% to 100%)**, itemizing every factual statement, and cross-referencing live news feeds in real time.

### 🚀 Highlights:
1. **Any Webpage URL Scraper**:
   - Paste any article link from **The Times of India**, **NDTV**, **The Hindu**, **Indian Express**, **BBC**, **Reuters**, or independent blogs.
   - Automatically cleans noise (ads, scripts, tracking) and extracts headline, author, publish date, and readable body text.
2. **Atomic Claim Extraction & Itemized Breakdown**:
   - Decomposes long articles into atomic declarative assertions.
   - Rates each claim independently (✅ *Verified True*, ⚠️ *Misleading / Mixed*, ❌ *Fabricated / Debunked*, 🔍 *Unverified*) with forensic reasoning.
3. **Calibrated Machine Learning Engine**:
   - Powered by **Scikit-Learn**, **TF-IDF N-Gram Vectorizers (1–2 grams)**, and **Calibrated Logistic / Passive-Aggressive Classifiers**.
   - Computes continuous posterior probability of journalistic authenticity.
4. **Real-Time Cross-Source Corroboration**:
   - Live query cross-referencing against Google News RSS feeds to check if reputable wire services (NDTV, TOI, Reuters, ANI, PTI) covered the event.
   - **Zero external paid API keys required** — runs out of the box!
5. **Debunk Signature Matching**:
   - Built-in signatures of widespread viral hoaxes (e.g. *GPS chip in Rs 2000 note*, *UNESCO best anthem*, *Lemon & baking soda cancer cure*, *5G radiation spread*, *WhatsApp red tick surveillance*), citing official debunks from **PIB Fact Check**, **AltNews**, **Snopes**, and **WHO**.
6. **Stylometric & Linguistic Forensics**:
   - Quantifies sensationalism, clickbait index, excessive ALL-CAPS text, urgency phrases (*"Forward to 10 groups before midnight"*), and journalistic attribution markers (*"according to official statement"*).
7. **Interactive Project Presentation Deck**:
   - Built directly into the web application at `/presentation` with keyboard navigation, presenter mode, and architecture diagrams.

---

## 📐 Mathematical Veracity Formula

Veritas calculates a weighted composite **Veracity Percentage ($V$)**:

$$V = \Big( 0.35 \times C_{\text{ratio}} + 0.30 \times M_{\text{prob}} + 0.20 \times D_{\text{trust}} + 0.15 \times S_{\text{corrob}} \Big)$$

Where:
- **$C_{\text{ratio}}$** = Mean truth score across all extracted atomic claims ($0 - 100\%$)
- **$M_{\text{prob}}$** = Calibrated Machine Learning authenticity probability ($0 - 100\%$)
- **$D_{\text{trust}}$** = Domain / Publisher Authority rating (e.g. *NDTV* = 92%, *TOI* = 90%, *PIB* = 98%, unknown blog = 55%, `.xyz`/`.top` = 25%)
- **$S_{\text{corrob}}$** = Real-time news wire corroboration score ($0 - 100\%$)

> ⚠️ **Critical Debunk Override**: If any extracted claim matches an accredited hoax or fact-checker debunk, the overall score is capped at $\le 18\%$, assigning a **FABRICATED / FAKE NEWS** verdict.

### Veracity Tiers:
| Veracity Score | Verdict Classification | Description |
| :---: | :---: | :--- |
| **82% – 100%** | 🟢 **VERIFIED AUTHENTIC** | Backed by credible sources, reputable publisher, objective tone |
| **65% – 81%** | 🔷 **MOSTLY ACCURATE** | Largely factual, minor unverified claims or secondary details |
| **45% – 64%** | 🟡 **MIXED / UNCONFIRMED** | Mixture of accurate context and unsubstantiated claims |
| **25% – 44%** | 🟠 **QUESTIONABLE / MISLEADING** | High sensationalism, emotional bias, uncorroborated assertions |
| **0% – 24%** | 🔴 **FABRICATED / FAKE NEWS** | Disinformation hoax, phishing scam, or debunked fabrication |

---

## 🏗️ System Architecture

```
[ User Input: News URL or Raw Text ]
                   │
                   ▼
       ┌────────────────────────┐
       │   Veritas Web Scraper  │ ──► [ Domain Reputation Matrix ]
       │ (TOI, NDTV, BBC, etc.) │     (NDTV: 92%, TOI: 90%, etc.)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │   Claim Decomposition  │ ──► [ Isolates Atomic Assertions ]
       └───────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐ ┌──────────────────────────────────────┐
│  ML Stylometrics │ │ Real-Time Corroboration Engine       │
│  - TF-IDF N-Gram │ │ - Google News Live Wire Query        │
│  - Passive-Aggr. │ │ - Fact-Check Debunk Signatures       │
│  - Clickbait Ptr.│ │ - Mainstream Media Verification     │
└────────┬─────────┘ └──────────────────┬───────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
       ┌─────────────────────────────────┐
       │  Veracity Percentage Calculator │
       │  (Weighted Multi-Factor Formula)│
       └────────────────┬────────────────┘
                        ▼
       ┌─────────────────────────────────┐
       │    Interactive Dashboard UI     │
       │ - Animated Radial Veracity Gauge│
       │ - Claim-by-Claim Breakdown Cards│
       │ - Live Corroborating Wires List │
       │ - Presentation Deck at /present │
       └─────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Backend & REST API** | Python 3.14, Flask 3.1, Requests |
| **Web Scraping & Ingestion** | BeautifulSoup4 (BS4), Urllib |
| **Machine Learning & NLP** | Scikit-Learn 1.9, TF-IDF Vectorizer, PassiveAggressiveClassifier, CalibratedClassifierCV, Joblib |
| **Stylometric Forensics** | Regex Pattern Forensics, Caps Ratio Engine, Sensationalism Index |
| **Live Corroboration** | XML ElementTree, Google News RSS Service (zero API keys needed) |
| **Frontend UI** | Modern HTML5, Tailwind CSS, Lucide Vector Icons, Glassmorphism CSS |
| **Presentation Deck** | Built-in interactive slide engine (`/presentation`) with keyboard controls |

---

## 📁 Project Directory Structure

```
fake-news-detector/
├── app.py                  # Flask web application & REST endpoints
├── scraper.py              # Resilient URL scraper & domain trust evaluator
├── ml_engine.py            # TF-IDF vectorizer & calibrated ML classifier
├── fact_checker.py         # Claim extraction, live corroboration & scoring
├── training_data.py        # Curated dataset & viral debunk database
├── fake_news_model.joblib  # Serialized calibrated machine learning model
├── tfidf_vectorizer.joblib # Serialized TF-IDF n-gram vectorizer
├── static/
│   ├── app.js              # Frontend interactivity, gauge animations & API calls
│   └── style.css           # Glassmorphism, animations & print media formatting
├── templates/
│   ├── index.html          # Main detection dashboard
│   └── presentation.html   # 8-Slide Interactive Architecture & Project Deck
└── README.md               # Detailed technical documentation
```

---

## ⚡ How to Run Locally

### 1. Requirements:
- Python 3.10+ (Tested on Python 3.14)
- Pip

### 2. Install Dependencies:
```bash
pip install flask scikit-learn pandas numpy requests beautifulsoup4 joblib
```

### 3. Launch Veritas Server:
```bash
cd "C:\Users\anurag yadav\.gemini\antigravity\scratch\fake-news-detector"
python app.py
```

### 4. Open in Browser:
- **Main Fact-Checking Dashboard**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **Interactive Presentation Deck**: [http://127.0.0.1:5000/presentation](http://127.0.0.1:5000/presentation)

---

## 📡 REST API Reference

### 1. Analyze News (`POST /api/analyze`)
**Request Body (JSON)**:
```json
{
  "url": "https://timesofindia.indiatimes.com/india/...",
  "text": "" 
}
```
*Or provide raw text:*
```json
{
  "url": "",
  "text": "UNESCO declares Indian National Anthem as best national anthem in the world. Share immediately!"
}
```

**Response (JSON)**:
```json
{
  "success": true,
  "veracity_percentage": 18.0,
  "verdict": "FABRICATED / FAKE NEWS",
  "verdict_badge": "rose",
  "verdict_description": "Critical indicators of disinformation, debunked hoaxes...",
  "claim_counts": {
    "total": 1,
    "true_claims": 0,
    "mixed_claims": 0,
    "false_claims": 1
  },
  "claims": [
    {
      "claim": "UNESCO declares Indian National Anthem as best anthem in the world.",
      "truth_score": 15.0,
      "status": "Flagged as False by Media",
      "badge_color": "rose",
      "reason": "Fact-checking articles detected: 'FAKE ALERT: No, UNESCO did not declare...' by The Times of India.",
      "corroborated": false
    }
  ],
  "corroboration_sources": [
    {
      "source": "The Times of India",
      "title": "FAKE ALERT: No, UNESCO did not declare...",
      "link": "https://...",
      "is_debunk": true
    }
  ],
  "metrics": {
    "ml_authenticity_score": 15.0,
    "claims_truth_ratio": 15.0,
    "publisher_trust_score": 50,
    "sensationalism_index": 43.3,
    "emotional_tone": "Alarmist / Clickbait"
  }
}
```

### 2. Fetch Sample Cases (`GET /api/samples`)
Returns 5 curated real-world presets (ISRO Chandrayaan-3, RBI Repo Rate, UNESCO Hoax, 2000 Note GPS chip, Lemon Cancer Cure).

---

## 🎯 Verification Features Summary
- **Live URL Extraction**: Analyzes live articles without manual copying.
- **Explainability First**: Every claim shows *why* it received its score.
- **Deception Forensics**: Flags clickbait buzzwords, alarmist phrasing, and lack of attribution.
- **Export & Print Ready**: Click "Print" to generate a clean, official Verification Fact Sheet.
- **Embedded Architecture Presentation**: 8 slides detailing math, design, and roadmap.
