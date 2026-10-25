from flask import Flask, render_template, request, jsonify
from pathlib import Path
import re
import joblib
import hashlib
from datetime import datetime
import urllib.parse
import requests
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "news_model.joblib"

app = Flask(__name__, static_folder="static", template_folder="templates")


def load_model():
    return joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None


pipeline = load_model()

# ==============================================================================
# Domain Credibility & Satire Registry
# ==============================================================================
DOMAIN_REGISTRY = {
    # Wire Services & Public Broadcasters
    "reuters.com": {"score": 98, "type": "wire", "label": "Verified Global Wire Service", "badge": "high-trust"},
    "apnews.com": {"score": 98, "type": "wire", "label": "Verified Major News Agency (AP)", "badge": "high-trust"},
    "afp.com": {"score": 97, "type": "wire", "label": "Verified Wire Service (AFP)", "badge": "high-trust"},
    "bbc.com": {"score": 95, "type": "broadcaster", "label": "Public Broadcaster (BBC)", "badge": "high-trust"},
    "bbc.co.uk": {"score": 95, "type": "broadcaster", "label": "Public Broadcaster (BBC UK)", "badge": "high-trust"},
    "npr.org": {"score": 94, "type": "broadcaster", "label": "National Public Radio (NPR)", "badge": "high-trust"},
    "pbs.org": {"score": 94, "type": "broadcaster", "label": "Public Broadcasting Service", "badge": "high-trust"},
    "bloomberg.com": {"score": 94, "type": "financial", "label": "Financial Wire (Bloomberg)", "badge": "high-trust"},

    # Investigative / Mainstream Newspapers & Periodicals
    "nytimes.com": {"score": 92, "type": "newspaper", "label": "The New York Times", "badge": "high-trust"},
    "washingtonpost.com": {"score": 91, "type": "newspaper", "label": "The Washington Post", "badge": "high-trust"},
    "wsj.com": {"score": 92, "type": "newspaper", "label": "The Wall Street Journal", "badge": "high-trust"},
    "theguardian.com": {"score": 91, "type": "newspaper", "label": "The Guardian", "badge": "high-trust"},
    "ft.com": {"score": 93, "type": "newspaper", "label": "Financial Times", "badge": "high-trust"},
    "economist.com": {"score": 93, "type": "journal", "label": "The Economist", "badge": "high-trust"},
    "nature.com": {"score": 99, "type": "science", "label": "Nature Science Journal", "badge": "high-trust"},
    "scientificamerican.com": {"score": 95, "type": "science", "label": "Scientific American", "badge": "high-trust"},
    "theatlantic.com": {"score": 89, "type": "journal", "label": "The Atlantic", "badge": "standard-trust"},
    "politico.com": {"score": 88, "type": "political", "label": "Politico", "badge": "standard-trust"},
    "forbes.com": {"score": 85, "type": "business", "label": "Forbes Media", "badge": "standard-trust"},
    "time.com": {"score": 87, "type": "magazine", "label": "TIME Magazine", "badge": "standard-trust"},
    "cnn.com": {"score": 83, "type": "cable", "label": "CNN News", "badge": "standard-trust"},
    "nbcnews.com": {"score": 86, "type": "network", "label": "NBC News", "badge": "standard-trust"},
    "cbsnews.com": {"score": 86, "type": "network", "label": "CBS News", "badge": "standard-trust"},
    "abcnews.go.com": {"score": 86, "type": "network", "label": "ABC News", "badge": "standard-trust"},
    "usatoday.com": {"score": 84, "type": "newspaper", "label": "USA Today", "badge": "standard-trust"},

    # Satire & Parody Publications (Crucial: Should not be flagged as malicious hoax)
    "theonion.com": {"score": 15, "type": "satire", "label": "The Onion (Verified Satire / Parody)", "badge": "satire"},
    "babylonbee.com": {"score": 15, "type": "satire", "label": "The Babylon Bee (Verified Satire / Parody)", "badge": "satire"},
    "clickhole.com": {"score": 15, "type": "satire", "label": "ClickHole (Verified Satire / Parody)", "badge": "satire"},
    "thebeaverton.com": {"score": 15, "type": "satire", "label": "The Beaverton (Verified Satire)", "badge": "satire"},
    "newsthump.com": {"score": 15, "type": "satire", "label": "NewsThump (UK Satire)", "badge": "satire"},
    "satirewire.com": {"score": 15, "type": "satire", "label": "SatireWire (Parody Media)", "badge": "satire"},

    # Known Conspiracy & Misinformation Domains
    "infowars.com": {"score": 10, "type": "conspiracy", "label": "Known Disinformation / Conspiracy", "badge": "untrusted"},
    "naturalnews.com": {"score": 12, "type": "conspiracy", "label": "Known Health Conspiracies & Pseudoscience", "badge": "untrusted"},
    "worldnewsdailyreport.com": {"score": 5, "type": "hoax", "label": "Known Fabricated Hoax Media", "badge": "untrusted"},
    "beforeitsnews.com": {"score": 12, "type": "conspiracy", "label": "Unvetted User Conspiracy Platform", "badge": "untrusted"},
    "thegatewaypundit.com": {"score": 20, "type": "hyperpartisan", "label": "Hyperpartisan / Low Factual Consistency", "badge": "untrusted"}
}


def get_domain_intelligence(url: str):
    """Extract and analyze domain reputation."""
    if not url:
        return None
    try:
        parsed = urllib.parse.urlparse(url if "://" in url else f"https://{url}")
        host = parsed.netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        host = host.split(":")[0]  # strip port if present

        if not host:
            return None

        # Direct domain match
        match = DOMAIN_REGISTRY.get(host)
        if not match:
            # Suffix match (e.g. news.bbc.co.uk -> bbc.co.uk)
            for registered_domain, data in DOMAIN_REGISTRY.items():
                if host.endswith("." + registered_domain):
                    match = data
                    break

        if match:
            return {
                "domain": host,
                "reputation_score": match["score"],
                "type": match["type"],
                "label": match["label"],
                "badge": match["badge"],
                "is_satire": match["type"] == "satire",
                "is_known_disinformation": match["type"] in {"conspiracy", "hoax", "untrusted"}
            }
        else:
            return {
                "domain": host,
                "reputation_score": 50,
                "type": "unregistered",
                "label": "Independent / Unregistered Domain",
                "badge": "neutral",
                "is_satire": False,
                "is_known_disinformation": False
            }
    except Exception:
        return None


def clean_news_text(text: str) -> str:
    """Strip dateline leakage to match training distribution."""
    if not isinstance(text, str):
        return ""
    cleaned = re.sub(r'^[A-Z\s,./\'-]{2,35}\((?:Reuters|AP|AFP)\)\s*[-—:]?\s*', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'^\((?:Reuters|AP|AFP)\)\s*[-—:]?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bReuters\b', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def analyze_sentences(article_text: str):
    """
    Splits article text into individual sentences and classifies each:
    - 'credible': verified attribution, quotes, institutional markers
    - 'sensational': clickbait trigger words, ALL-CAPS, emotional hyperbole
    - 'unsubstantiated': broad assertive claims without cited sources
    - 'neutral': balanced descriptive context
    """
    if not article_text:
        return {"sentences": [], "summary_stats": {"total": 0, "credible": 0, "sensational": 0, "unsubstantiated": 0, "neutral": 0}}

    # Split into sentences using punctuation boundaries
    raw_sentences = re.split(r'(?<=[.!?])\s+', article_text.strip())
    raw_sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 10]

    sensational_words = {
        "shocking", "bombshell", "unbelievable", "secret", "exposed", "scandal",
        "destroy", "destroyed", "cabal", "hoax", "conspiracy", "mainstream",
        "jawdropping", "must-see", "horrifying", "urgent", "miracle", "poison",
        "alien", "microchip", "illuminati", "disgrace", "treason", "traitor",
        "scumbag", "brainwashed", "terrifying", "presstitutes", "elites"
    }
    attr_verbs = {
        "said", "reported", "stated", "confirmed", "announced", "testified",
        "found", "noted", "according", "concluded", "projected", "commented", "declared"
    }
    official_markers = {
        "spokesperson", "department", "official", "officials", "university",
        "researchers", "scientists", "agency", "authorities", "commission", "bureau", "investigators"
    }
    unsubstantiated_phrases = [
        "everybody knows", "undeniable proof", "they don't want you to know",
        "without a doubt", "wake up", "share this before", "guaranteed proof",
        "it is obvious that", "100% confirmed by insider"
    ]

    analyzed = []
    stats = {"total": len(raw_sentences), "credible": 0, "sensational": 0, "unsubstantiated": 0, "neutral": 0}

    for idx, sentence in enumerate(raw_sentences):
        words = re.findall(r'\b[a-zA-Z]+\b', sentence)
        reasons = []
        category = "neutral"

        # Check for Sensational indicators
        has_sens_words = [w.lower() for w in words if w.lower() in sensational_words]
        caps_words = [w for w in words if w.isupper() and len(w) > 1 and w.lower() not in {"usa", "us", "uk", "eu", "un", "gop", "fbi", "cia", "nasa", "ai", "ceo"}]
        exclamations = sentence.count("!")

        if has_sens_words:
            reasons.append(f"Contains sensational buzzwords: '{', '.join(has_sens_words[:2])}'")
        if len(caps_words) >= 2:
            reasons.append(f"Capitalized emotional wording ({', '.join(caps_words[:3])})")
        if exclamations >= 2:
            reasons.append("Multiple exclamation points")

        # Check for Unsubstantiated claims
        for phrase in unsubstantiated_phrases:
            if phrase in sentence.lower():
                reasons.append(f"Uses conspiratorial rhetoric ('{phrase}')")

        # Check for Credible Attribution indicators
        has_quotes = bool(re.search(r'["\u201c\u201d\u2018\u2019][^"\u201c\u201d\u2018\u2019]{4,}["\u201c\u201d\u2018\u2019]', sentence))
        has_attr = [w.lower() for w in words if w.lower() in attr_verbs]
        has_official = [w.lower() for w in words if w.lower() in official_markers]

        if has_quotes:
            reasons.append("Direct quote from attributed source")
        if has_attr:
            reasons.append(f"Neutral journalistic attribution verb ('{has_attr[0]}')")
        if has_official:
            reasons.append(f"References formal or scientific institution ('{has_official[0]}')")

        # Prioritize categorization
        if reasons and (has_sens_words or len(caps_words) >= 2 or exclamations >= 2):
            category = "sensational"
            stats["sensational"] += 1
        elif any("rhetoric" in r for r in reasons):
            category = "unsubstantiated"
            stats["unsubstantiated"] += 1
        elif has_quotes or (has_attr and has_official) or (has_attr and len(words) > 12):
            category = "credible"
            stats["credible"] += 1
        else:
            category = "neutral"
            stats["neutral"] += 1
            if not reasons:
                reasons.append("Standard neutral descriptive context")

        analyzed.append({
            "id": idx + 1,
            "text": sentence,
            "category": category,
            "reasons": reasons
        })

    return {"sentences": analyzed, "summary_stats": stats}


def analyze_linguistic_signals(headline: str, article: str):
    """
    Computes NLP stylometric signals:
    - Sensationalism & Clickbait Index
    - Journalistic Attribution Score
    - Objectivity & Tone
    """
    full_text = f"{headline} {article}".strip()
    words = re.findall(r'\b[a-zA-Z]+\b', full_text)
    total_words = max(len(words), 1)

    sensational_words = {
        "shocking", "bombshell", "unbelievable", "secret", "exposed", "scandal",
        "destroy", "destroyed", "cabal", "hoax", "conspiracy", "mainstream",
        "bizarre", "jawdropping", "must-see", "horrifying", "urgent",
        "breakdown", "miracle", "poison", "alien", "microchip", "illuminati",
        "disgrace", "treason", "traitor", "scumbag", "brainwashed", "terrifying"
    }
    caps_words = [w for w in words if w.isupper() and len(w) > 1 and w.lower() not in {"usa", "us", "uk", "eu", "un", "gop", "fbi", "cia", "nasa", "ai", "ceo"}]
    sensational_matches = [w.lower() for w in words if w.lower() in sensational_words]
    exclamations = full_text.count("!")
    question_marks = full_text.count("?")

    sensational_score = min(
        100,
        int((len(caps_words) * 7) + (len(sensational_matches) * 15) + (exclamations * 8) + (max(0, question_marks - 1) * 6))
    )

    quotes = len(re.findall(r'["\u201c\u201d\u2018\u2019][^"\u201c\u201d\u2018\u2019]{6,}["\u201c\u201d\u2018\u2019]', full_text))
    attribution_verbs = {
        "said", "reported", "stated", "confirmed", "announced", "testified",
        "found", "noted", "according", "concluded", "explained", "projected",
        "commented", "declared", "added", "cited", "revealed", "spoke"
    }
    attr_matches = [w.lower() for w in words if w.lower() in attribution_verbs]
    official_markers = {
        "spokesperson", "department", "official", "officials", "university",
        "researchers", "scientists", "agency", "authorities", "commission",
        "bureau", "spokesman", "spokeswoman", "investigators", "analysts"
    }
    official_matches = [w.lower() for w in words if w.lower() in official_markers]

    sourcing_score = min(
        100,
        int((quotes * 20) + (len(attr_matches) * 12) + (len(official_matches) * 14) + (20 if total_words > 60 else 10))
    )

    emotional_score = max(0, min(100, 100 - sensational_score + (sourcing_score // 3)))

    signals = []
    if quotes > 0:
        signals.append({"type": "positive", "text": f"Found {quotes} direct quote(s) or attributed statements"})
    if len(official_matches) > 0:
        signals.append({"type": "positive", "text": "References institutional, scientific, or official entities"})
    if len(attr_matches) > 0:
        signals.append({"type": "positive", "text": "Uses neutral journalistic reporting verbs ('said', 'reported', 'confirmed')"})
    
    if len(caps_words) >= 3:
        signals.append({"type": "negative", "text": f"Contains {len(caps_words)} ALL-CAPS words indicative of sensationalism"})
    if exclamations >= 2:
        signals.append({"type": "negative", "text": "Excessive exclamation marks uncommon in professional journalism"})
    if len(sensational_matches) >= 2:
        matched_sample = ", ".join(list(set(sensational_matches))[:3])
        signals.append({"type": "negative", "text": f"Contains clickbait/hyperbolic trigger words ({matched_sample})"})

    return {
        "sensational_score": sensational_score,
        "sourcing_score": sourcing_score,
        "objectivity_score": emotional_score,
        "signals": signals,
        "caps_count": len(caps_words),
        "quote_count": quotes
    }


# ==============================================================================
# Routes
# ==============================================================================
@app.route("/")
def index():
    return render_template("index.html", model_ready=pipeline is not None)


@app.route("/api/scrape-url", methods=["POST"])
def scrape_url():
    """Scrapes news articles from public URLs and evaluates domain trust."""
    payload = request.get_json(silent=True) or {}
    url = str(payload.get("url", "")).strip()

    if not url:
        return jsonify({"error": "Please provide a valid article URL."}), 400

    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    domain_info = get_domain_intelligence(url)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=12)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Failed to fetch URL ({str(e)}). Some publishers block automated scraping. You can copy & paste the text directly into the input desk.",
            "domain_info": domain_info
        }), 422

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract Headline
    headline = ""
    og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "twitter:title"})
    if og_title and og_title.get("content"):
        headline = og_title["content"].strip()
    elif soup.find("h1"):
        headline = soup.find("h1").get_text().strip()
    elif soup.title:
        headline = soup.title.get_text().strip()

    # Extract Author & Date
    author = ""
    author_meta = soup.find("meta", attrs={"name": "author"}) or soup.find("meta", property="article:author")
    if author_meta and author_meta.get("content"):
        author = author_meta["content"].strip()

    date = ""
    date_meta = soup.find("meta", property="article:published_time") or soup.find("time")
    if date_meta:
        date = date_meta.get("content") or date_meta.get_text() or ""

    # Remove script, style, nav, footer, header tags
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    # Extract article text from semantic tags
    article_container = soup.find("article") or soup.find("main") or soup.find(class_=re.compile(r'article[-_]?body|story[-_]?content|post[-_]?content', re.I))
    if article_container:
        paragraphs = [p.get_text().strip() for p in article_container.find_all("p") if len(p.get_text().strip()) > 35]
    else:
        paragraphs = [p.get_text().strip() for p in soup.find_all("p") if len(p.get_text().strip()) > 35]

    article_text = "\n\n".join(paragraphs[:30])

    if not headline and not article_text:
        return jsonify({
            "error": "Could not automatically parse article body from this page. Please copy and paste the headline and text manually.",
            "domain_info": domain_info
        }), 422

    return jsonify({
        "headline": headline,
        "article": article_text,
        "author": author,
        "date": date,
        "url": url,
        "domain_info": domain_info
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    global pipeline
    if pipeline is None:
        pipeline = load_model()
    if pipeline is None:
        return jsonify({
            "error": "Model is not trained yet. Run 'python train_model.py' to generate the model."
        }), 503

    payload = request.get_json(silent=True) or {}
    headline = str(payload.get("headline", "")).strip()
    article = str(payload.get("article", "")).strip()
    source_url = str(payload.get("url", "")).strip()

    raw_text = " ".join(x for x in [headline, article] if x).strip()

    if len(raw_text) < 25:
        return jsonify({
            "error": "Please enter a news headline or article with at least 25 characters."
        }), 400

    clean_text = clean_news_text(raw_text)
    prediction = str(pipeline.predict([clean_text])[0])
    
    try:
        probas = pipeline.predict_proba([clean_text])[0]
        classes = list(pipeline.classes_)
        real_idx = classes.index("REAL") if "REAL" in classes else 0
        real_prob = float(probas[real_idx])
    except Exception:
        real_prob = 0.5

    # Run linguistic analysis
    ling = analyze_linguistic_signals(headline, article)

    # Run sentence-by-sentence claim heatmap
    sentence_heatmap = analyze_sentences(article if article else headline)

    # Domain intelligence check
    domain_info = get_domain_intelligence(source_url) if source_url else None

    # Hybrid Credibility Score (0-100%)
    model_score = real_prob * 100
    stylometry_modifier = (ling["sourcing_score"] * 0.15) - (ling["sensational_score"] * 0.15)
    base_credibility = model_score * 0.75 + (50 + stylometry_modifier) * 0.25

    # Domain influence modifier
    if domain_info:
        if domain_info["badge"] == "high-trust":
            base_credibility = (base_credibility * 0.8) + (domain_info["reputation_score"] * 0.2)
        elif domain_info["is_satire"]:
            base_credibility = 15.0
        elif domain_info["is_known_disinformation"]:
            base_credibility = min(base_credibility, 20.0)

    credibility_score = max(5, min(98, round(base_credibility, 1)))

    # Determine Verdict with Satire handling
    if domain_info and domain_info["is_satire"]:
        verdict = "VERIFIED SATIRE / PARODY"
        verdict_type = "satire"
        summary = f"Published by {domain_info['label']}. This is intentional humor/satire and not designed to report factual breaking news."
    elif (credibility_score >= 55 or (prediction == "REAL" and ling["sensational_score"] <= 25 and credibility_score >= 48)) and ling["sensational_score"] < 40:
        verdict = "VERIFIED CREDIBLE"
        verdict_type = "real"
        summary = "Matches patterns of legitimate, professionally reported news with objective phrasing, credible syntax, and absent sensationalism."
    elif credibility_score <= 40 or (prediction == "FAKE" and ling["sensational_score"] >= 45):
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        summary = "Displays prominent characteristics of misleading articles, viral hoaxes, or clickbait exaggeration."
    else:
        verdict = "UNVERIFIED / MIXED SIGNALS"
        verdict_type = "mixed"
        summary = "Contains mixed stylistic indicators. We recommend cross-referencing with primary wire services."

    # Cryptographic SHA-256 fingerprint & Case ID
    sha256_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
    case_id = f"NC-{datetime.utcnow().year}-{sha256_hash[:8].upper()}"
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    return jsonify({
        "case_id": case_id,
        "timestamp": timestamp,
        "sha256": sha256_hash,
        "verdict": verdict,
        "verdict_type": verdict_type,
        "prediction": prediction.upper(),
        "credibility_score": credibility_score,
        "model_confidence": round(float(max(pipeline.predict_proba([clean_text])[0])) * 100, 1),
        "summary": summary,
        "linguistics": ling,
        "sentence_heatmap": sentence_heatmap,
        "domain_info": domain_info,
        "notice": "This analysis evaluates text stylometry, domain trust, and machine-learning patterns. Always verify critical claims with independent primary sources."
    })


@app.route("/api/status")
def status():
    return jsonify({
        "model_ready": pipeline is not None,
        "model_path": str(MODEL_PATH)
    })


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "").lower() == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
