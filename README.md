# NewsCheck — AI News Credibility & Fact-Checker

A professional full-stack NLP news verification engine featuring a trained TF-IDF + Logistic Regression machine learning model, domain trust reputation intelligence, linguistic stylometric feature extraction, interactive sentence-level claim heatmaps, and downloadable fact-check dossiers.

---

## ⚡ Quick Start

### 1. Launch the Web Application
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

> **Direct File Preview:** You can also double-click `index.html` in the project root to open the verification desk directly in any browser with instant client-side analysis.

---

## 🚀 Advanced Real-World Features (Newly Added)

### 1. 🔗 Article Web Scraper & Domain Trust Engine
- **Direct Link Verification:** Paste any public article URL (e.g., from BBC, Reuters, NYT, The Onion) and click **"Fetch & Verify Link"**. The engine automatically extracts the headline, byline, publication date, and body paragraphs.
- **Domain Trust Registry:** Evaluates publishers against a registry of wire services, public broadcasters, reputable journals, satire media, and unvetted conspiracy outlets.
- **Satire Recognition:** Specifically identifies satire publications (*The Onion*, *The Babylon Bee*, *ClickHole*) as intentional parody rather than classifying them as malicious hoaxes.

### 2. 🟢 Sentence-Level Claim Heatmap & Visual Highlighter
- **Visual Claim Inspection:** The article body is parsed into individual sentences and color-coded:
  - 🟢 **Credible / Attributed:** Direct quotes, citations of official institutions, or neutral journalistic verbs (`stated`, `reported`).
  - 🔴 **Sensational / Clickbait:** Emotional hyperbole, clickbait buzzwords (`BOMBSHELL`, `SHOCKING`), ALL-CAPS words, and punctuation outbursts.
  - 🟡 **Unsubstantiated Rhetoric:** Sweeping claims without sources or evidentiary backing.
  - ⚪ **Neutral:** Balanced descriptive context.
- **Interactive Inspector:** Click or hover over any sentence to view a breakdown of the specific linguistic signals detected.
- **Filter Chips:** Filter the view to examine only sensational or unverified claims.

### 3. 📥 Downloadable Fact-Check PDF Dossier & JSON Export
- **One-Click PDF Report:** Generates an official, print-formatted **Intelligence Dossier** complete with:
  - Unique Case ID (e.g. `NC-2026-3FAA4B05`)
  - Cryptographic SHA-256 fingerprint of the analyzed text
  - Official UTC Verification Timestamp
  - Overall Credibility Score, verdict badge, and sub-metric gauges
  - Full sentence heatmap findings
- **JSON Export:** Download machine-readable `.json` data for archiving, investigative reporting, or academic research.

---

## 🧠 Core Model & NLP Engine

1. **Wire-Service Leakage Elimination**:
   - Strips publisher datelines (`WASHINGTON (Reuters) -`) from training data so the model evaluates real-world syntax, attribution, and vocabulary rather than memorizing publisher names.
2. **Hybrid Credibility Scoring**:
   - Ensemble of Scikit-Learn TF-IDF classifier (trained on 39,000+ unique articles with 98.9% test accuracy), domain trust score, and 3 stylometric sub-meters:
     - **Sensationalism Index** (0–100%)
     - **Attribution & Sourcing Meter** (0–100%)
     - **Objectivity & Neutral Tone** (0–100%)
3. **1-Click Verified Demonstration Samples**:
   - **Real News 1:** Federal Reserve Interest Rate Decision *(Economy)*
   - **Real News 2:** James Webb Space Telescope Galaxy Discovery *(Science)*
   - **Satire Sample:** The Onion Ancient Civilization Parody *(Satire)*
   - **Fake News 1:** Secret Tap Water Mind-Control Cabal *(Conspiracy)*
   - **Fake News 2:** Viral Underground Celebrity Island Party Hoax *(Clickbait)*

---

## 🛠️ Project Structure

```text
fake-news-detector/
├── app.py              # Flask API, URL scraper, sentence analyzer, domain registry
├── train_model.py      # Cleans dataset, trains model, exports news_model.joblib
├── requirements.txt    # Python dependencies (Flask, pandas, scikit-learn, requests, bs4)
├── index.html          # Standalone client preview (works without server)
├── README.md           # Documentation
├── data/
│   ├── Fake.csv        # Extracted Kaggle fake news dataset (23 MB)
│   └── True.csv        # Extracted Kaggle real news dataset (18 MB)
├── model/
│   └── news_model.joblib  # Trained, leakage-free Scikit-Learn model
├── templates/
│   └── index.html      # Flask Jinja2 web template with heatmap & PDF export
└── static/
    ├── style.css       # Newsroom CSS design system & @media print styles
    └── script.js       # Dynamic UI interactions, sentence heatmap & export tools
```

---

## 🔁 Re-training the Model (Optional)

The pre-trained model `model/news_model.joblib` is already trained and ready. To retrain:
```bash
python train_model.py
```
