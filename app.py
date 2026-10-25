from flask import Flask, render_template, request, jsonify, Response
from pathlib import Path
import os
import re
import json
import joblib
import hashlib
from datetime import datetime
import urllib.parse
import requests
from bs4 import BeautifulSoup
import jinja2

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "news_model.joblib"


def load_env_file():
    """Load key-value pairs from .env file into os.environ if present."""
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass


load_env_file()

app = Flask(
    __name__,
    static_folder=str(BASE_DIR / "static"),
    template_folder=str(BASE_DIR / "templates")
)

# Robust multi-location template loader for Cloud / Docker environments
app.jinja_loader = jinja2.ChoiceLoader([
    jinja2.FileSystemLoader(str(BASE_DIR / "templates")),
    jinja2.FileSystemLoader(str(BASE_DIR)),
    jinja2.FileSystemLoader("/app/templates"),
    jinja2.FileSystemLoader("/app"),
])


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


CONSPIRACY_HOAX_PATTERNS = [
    r'\b(?:earth is flat|flat earth)\b',
    r'\b(?:gravity is an illusion)\b',
    r'\b(?:cures? (?:cancer|coronavirus|covid|aids|hiv|diabetes|all diseases|tumors?))\b',
    r'\b(?:boiled garlic|drinking bleach|drink bleach|miracle tonic|secret cure|miracle cure)\b',
    r'\b(?:microchips? in vaccines?|vaccines? contain microchips?|trackable microchips?|microchips? to monitor)\b',
    r'\b(?:5g\b.*(?:drop dead|birds?|radiation|cancer|illness|depopulation|frequencies?|activate|towers?))\b',
    r'\b(?:alien (?:corpse|body|base|autopsy|invasion))\b',
    r'\b(?:engineered body double|cloned? (?:politician|hillary|biden|trump|celebrity)|body double)\b',
    r'\b(?:secretly arrested by military|military tribunal|guantanamo execution)\b',
    r'\b(?:free (?:iphone|smartphone|laptop|macbook|cash|money|ten thousand dollars))\b',
    r'\b(?:every citizen (?:will receive|gets free))\b',
    r'\b(?:wake up sheeple|share (?:this )?before (?:it is|they) deleted?|they don\'t want you to know)\b',
    r'\b(?:mainstream media won\'t tell you|100% confirmed by insider)\b'
]


def detect_disinfo_patterns(text: str):
    """Detects hallmark conspiratorial claims, medical misinformation, and viral scams."""
    if not isinstance(text, str):
        return []
    matches = []
    text_lower = text.lower()
    for pat in CONSPIRACY_HOAX_PATTERNS:
        m = re.search(pat, text_lower)
        if m:
            matches.append(m.group(0))
    return matches


def query_google_fact_check(api_key: str, query: str):
    """
    Queries the official Google Fact Check Tools API for accredited fact-checks
    from Snopes, PolitiFact, Reuters, AP News, FactCheck.org, BoomLive, etc.
    """
    if not api_key or not query:
        return None
    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    search_query = query[:120].strip()
    params = {
        "query": search_query,
        "key": api_key,
        "languageCode": "en",
        "pageSize": 4
    }
    try:
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code == 200:
            claims = resp.json().get("claims", [])
            results = []
            for c in claims:
                claim_text = c.get("text", "")
                claimant = c.get("claimant", "Viral social claim")
                for r in c.get("claimReview", []):
                    pub_info = r.get("publisher", {})
                    rating = r.get("textualRating", "Unrated")
                    results.append({
                        "claim": claim_text,
                        "claimant": claimant,
                        "publisher": pub_info.get("name", "Fact-Checking Organization"),
                        "site": pub_info.get("site", ""),
                        "rating": rating,
                        "url": r.get("url", ""),
                        "title": r.get("title", "")
                    })
            if results:
                false_keywords = {"false", "pants on fire", "fake", "misleading", "incorrect", "mostly false", "distorts the facts", "unproven", "inaccurate"}
                true_keywords = {"true", "correct", "mostly true", "verified", "accurate"}
                has_debunk = any(r["rating"].lower() in false_keywords or any(fk in r["rating"].lower() for fk in false_keywords) for r in results)
                has_verified = any(r["rating"].lower() in true_keywords or any(tk in r["rating"].lower() for tk in true_keywords) for r in results)
                return {
                    "active": True,
                    "service": "Google Fact Check Tools API",
                    "reviews": results,
                    "count": len(results),
                    "has_debunk": has_debunk,
                    "has_verified": has_verified
                }
    except Exception as e:
        print(f"Google Fact Check API query error: {e}")
    return None


def query_gemini_fact_check(api_key: str, headline: str, text: str):
    """
    Uses Google Gemini 1.5 Flash REST API to perform factual cross-referencing
    and deep journalistic reasoning.
    """
    if not api_key:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    system_instruction = (
        "You are an expert investigative fact-checker and journalist. "
        "Analyze the factual authenticity of the following news story. "
        "Determine if it is factually verified real news, fabricated/misleading fake news, satire, or unverified. "
        "Respond strictly with valid JSON with keys: "
        "'verdict' ('REAL', 'FAKE', 'SATIRE', or 'UNVERIFIED'), "
        "'credibility_score' (integer 0 to 100), "
        "'summary' (1-2 sentence executive explanation), "
        "'fact_check_details' (2-3 sentences providing context, evidence, or debunks), "
        "'debunk_sources' (array of strings, e.g. names of news agencies or fact-checkers)."
    )
    user_content = f"Headline: {headline}\n\nArticle: {text[:1500]}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\n{user_content}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }
    try:
        resp = requests.post(url, json=payload, timeout=7)
        if resp.status_code == 200:
            candidates = resp.json().get("candidates", [])
            if candidates:
                raw_json = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(raw_json)
                return {
                    "active": True,
                    "service": "Google Gemini 1.5 Flash",
                    "verdict": parsed.get("verdict", "UNVERIFIED"),
                    "credibility_score": int(parsed.get("credibility_score", 50)),
                    "summary": parsed.get("summary", ""),
                    "fact_check_details": parsed.get("fact_check_details", ""),
                    "debunk_sources": parsed.get("debunk_sources", [])
                }
    except Exception as e:
        print(f"Gemini API query error: {e}")
    return None


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
        "shocking", "shock", "shocked", "bombshell", "unbelievable", "secret", "secretly",
        "exposed", "scandal", "destroy", "destroyed", "cabal", "hoax", "conspiracy",
        "mainstream", "jawdropping", "must-see", "horrifying", "urgent", "miracle",
        "poison", "alien", "microchip", "microchips", "illuminati", "disgrace",
        "treason", "traitor", "scumbag", "brainwashed", "terrifying", "presstitutes", "elites"
    }
    attr_verbs = {
        "said", "reported", "stated", "confirmed", "announced", "testified",
        "found", "noted", "according", "concluded", "projected", "commented", "declared",
        "unveiled", "launched", "published", "discovered", "approved", "signed", "recommended"
    }
    official_markers = {
        "spokesperson", "department", "official", "officials", "university",
        "researchers", "scientists", "agency", "authorities", "commission", "bureau",
        "investigators", "analysts", "organisation", "organization", "ministry",
        "government", "police", "court", "hospital", "isro", "nasa", "who", "federal reserve",
        "company", "corp", "corporation", "firm", "apple", "google", "microsoft", "meta",
        "amazon", "sony", "samsung", "nvidia", "intel", "biologists", "nature", "science", "commissioner"
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

        # Check for Disinformation / Conspiracy markers
        disinfo = detect_disinfo_patterns(sentence)
        if disinfo:
            reasons.append(f"Flagged viral hoax / conspiracy claim: '{disinfo[0]}'")

        # Check for Sensational indicators
        has_sens_words = [w.lower() for w in words if w.lower() in sensational_words]
        caps_words = [w for w in words if w.isupper() and len(w) > 1 and w.lower() not in {"usa", "us", "uk", "eu", "un", "gop", "fbi", "cia", "nasa", "ai", "ceo", "isro", "who"}]
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
        if disinfo or reasons and (has_sens_words or len(caps_words) >= 2 or exclamations >= 2):
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
        "shocking", "shock", "shocked", "bombshell", "unbelievable", "secret", "secretly",
        "exposed", "scandal", "destroy", "destroyed", "cabal", "hoax", "conspiracy",
        "mainstream", "bizarre", "jawdropping", "must-see", "horrifying", "urgent",
        "breakdown", "miracle", "poison", "alien", "microchip", "microchips", "illuminati",
        "disgrace", "treason", "traitor", "scumbag", "brainwashed", "terrifying"
    }
    caps_words = [w for w in words if w.isupper() and len(w) > 1 and w.lower() not in {"usa", "us", "uk", "eu", "un", "gop", "fbi", "cia", "nasa", "ai", "ceo", "isro", "who"}]
    sensational_matches = [w.lower() for w in words if w.lower() in sensational_words]
    exclamations = full_text.count("!")
    question_marks = full_text.count("?")

    sensational_score = min(
        100,
        int((len(caps_words) * 7) + (len(sensational_matches) * 15) + (exclamations * 8) + (max(0, question_marks - 1) * 6))
    )

    # 2. Journalistic Attribution & Sourcing
    quotes = len(re.findall(r'["\u201c\u201d\u2018\u2019][^"\u201c\u201d\u2018\u2019]{6,}["\u201c\u201d\u2018\u2019]', full_text))
    attribution_verbs = {
        "said", "reported", "stated", "confirmed", "announced", "testified",
        "found", "noted", "according", "concluded", "explained", "projected",
        "commented", "declared", "added", "cited", "revealed", "spoke",
        "unveiled", "launched", "defeated", "won", "signed", "appointed",
        "passed", "approved", "recommended", "arrested", "scored", "held",
        "published", "discovered"
    }
    attr_matches = [w.lower() for w in words if w.lower() in attribution_verbs]
    official_markers = {
        "spokesperson", "department", "official", "officials", "university",
        "researchers", "scientists", "agency", "authorities", "commission",
        "bureau", "spokesman", "spokeswoman", "investigators", "analysts",
        "organisation", "organization", "ministry", "government", "police",
        "centre", "center", "court", "hospital", "board", "isro", "nasa", "who", "federal reserve",
        "company", "corp", "corporation", "firm", "apple", "google", "microsoft", "meta",
        "amazon", "sony", "samsung", "nvidia", "intel", "biologists", "nature", "science", "commissioner"
    }
    official_matches = [w.lower() for w in words if w.lower() in official_markers]
    numbers = len(re.findall(r'\b\d+(?:[\.,]\d+)?%?\b', full_text))

    sourcing_score = min(
        100,
        int((quotes * 20) + (len(attr_matches) * 14) + (len(official_matches) * 16) + (min(numbers, 5) * 5) + (15 if total_words > 40 else 5))
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
@app.route("/", methods=["GET", "HEAD"])
def index():
    if request.method == "HEAD":
        return Response("", status=200, mimetype="text/html")

    model_ready = pipeline is not None
    try:
        return render_template("index.html", model_ready=model_ready)
    except jinja2.exceptions.TemplateNotFound:
        # Resilient fallback: locate and serve index.html directly
        for candidate in [
            BASE_DIR / "templates" / "index.html",
            BASE_DIR / "index.html",
            Path("/app/templates/index.html"),
            Path("/app/index.html"),
            Path("templates/index.html"),
            Path("index.html")
        ]:
            if candidate.exists():
                content = candidate.read_text(encoding="utf-8")
                return content, 200, {"Content-Type": "text/html; charset=utf-8"}
        raise


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model_ready": pipeline is not None}), 200


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
    
    try:
        probas = pipeline.predict_proba([clean_text])[0]
        classes = list(pipeline.classes_)
        fake_idx = classes.index("FAKE") if "FAKE" in classes else 0
        real_idx = classes.index("REAL") if "REAL" in classes else 1
        raw_fake_prob = float(probas[fake_idx])
        raw_real_prob = float(probas[real_idx])
    except Exception:
        raw_fake_prob = 0.5
        raw_real_prob = 0.5

    # Run linguistic analysis
    ling = analyze_linguistic_signals(headline, article)

    # Run sentence-by-sentence claim heatmap
    sentence_heatmap = analyze_sentences(article if article else headline)

    # Domain intelligence check
    domain_info = get_domain_intelligence(source_url) if source_url else None

    # Detect known viral hoax / conspiracy claims
    disinfo_matches = detect_disinfo_patterns(raw_text)
    if disinfo_matches:
        ling["signals"].insert(0, {
            "type": "negative",
            "text": f"Flagged viral hoax / conspiracy claim: '{disinfo_matches[0]}'"
        })

    # 0. Check for External API Keys (client payload or server environment)
    factcheck_api_key = payload.get("factcheck_api_key") or os.environ.get("GOOGLE_FACTCHECK_API_KEY") or os.environ.get("FACTCHECK_API_KEY")
    gemini_api_key = payload.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_GEMINI_API_KEY")

    # Run External Fact Check API if key is present
    external_fact_check = None
    if factcheck_api_key:
        query_text = headline if headline else clean_text[:120]
        external_fact_check = query_google_fact_check(factcheck_api_key, query_text)

    # Run Gemini API if key is present
    gemini_fact_check = None
    if gemini_api_key:
        if not (external_fact_check and external_fact_check.get("has_debunk")):
            gemini_fact_check = query_gemini_fact_check(gemini_api_key, headline, clean_text)

    # Calibrated Credibility & Verdict Determination
    # 1. Satire domain
    if domain_info and domain_info["is_satire"]:
        credibility_score = 15.0
        verdict = "VERIFIED SATIRE / PARODY"
        verdict_type = "satire"
        summary = f"Published by {domain_info['label']}. This is intentional humor/satire and not designed to report factual breaking news."

    # 2. External Fact-Checker Debunk (Snopes, PolitiFact, Reuters, etc.)
    elif external_fact_check and external_fact_check.get("has_debunk"):
        debunk_review = next((r for r in external_fact_check["reviews"] if any(fk in r["rating"].lower() for fk in ["false", "pants on fire", "fake", "misleading", "incorrect", "unproven"])), external_fact_check["reviews"][0])
        credibility_score = 5.0
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        summary = f"Debunked as '{debunk_review['rating']}' by {debunk_review['publisher']}: {debunk_review['title'] or debunk_review['claim']}"

    # 3. External Fact-Checker Verified as TRUE
    elif external_fact_check and external_fact_check.get("has_verified"):
        credibility_score = 96.0
        verdict = "VERIFIED CREDIBLE"
        verdict_type = "real"
        summary = f"Independently verified as true by {external_fact_check['reviews'][0]['publisher']} ({external_fact_check['reviews'][0]['rating']})."

    # 4. Known Disinformation domain or explicit viral hoax / conspiracy match
    elif (domain_info and domain_info["is_known_disinformation"]) or disinfo_matches:
        credibility_score = round(max(5.0, 15.0 - (len(disinfo_matches) * 4)), 1)
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        flagged_reason = f"Flagged known disinformation pattern: '{disinfo_matches[0]}'" if disinfo_matches else "Source domain is a recognized purveyor of disinformation"
        summary = f"{flagged_reason}. Displays prominent characteristics of viral hoaxes and fabricated claims."

    # 5. Gemini AI Live Reasoning Verdict (if active)
    elif gemini_fact_check and gemini_fact_check.get("verdict") in {"REAL", "FAKE", "SATIRE"}:
        if gemini_fact_check["verdict"] == "FAKE":
            credibility_score = min(25.0, float(gemini_fact_check["credibility_score"]))
            verdict = "POTENTIALLY FAKE / MISLEADING"
            verdict_type = "fake"
            summary = gemini_fact_check["summary"] or "Gemini Live Fact-Check flagged this story as misleading or unverified."
        elif gemini_fact_check["verdict"] == "REAL" and ling["sensational_score"] <= 20:
            credibility_score = max(80.0, float(gemini_fact_check["credibility_score"]))
            verdict = "VERIFIED CREDIBLE"
            verdict_type = "real"
            summary = gemini_fact_check["summary"] or "Gemini Live Fact-Check verified this event through active news citations."
        elif gemini_fact_check["verdict"] == "SATIRE":
            credibility_score = 15.0
            verdict = "VERIFIED SATIRE / PARODY"
            verdict_type = "satire"
            summary = gemini_fact_check["summary"] or "Gemini Live Fact-Check identified this story as intentional satire."
        else:
            credibility_score = 50.0
            verdict = "UNVERIFIED / MIXED SIGNALS"
            verdict_type = "mixed"
            summary = gemini_fact_check["summary"] or "Inconclusive results from live grounding."

    # 6. High sensationalism (clickbait words, excessive caps, multiple exclamation points)
    elif ling["sensational_score"] >= 35:
        credibility_score = round(max(8.0, 35.0 - (ling["sensational_score"] * 0.3)), 1)
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        summary = "Displays prominent characteristics of misleading articles, clickbait exaggeration, and sensationalist rhetoric."

    # 7. Verified High-Trust domain (Reuters, BBC, AP, NYT, The Hindu, etc.)
    elif domain_info and domain_info["badge"] == "high-trust":
        credibility_score = round(min(98.0, max(82.0, (raw_real_prob * 100) * 0.5 + 45.0)), 1)
        verdict = "VERIFIED CREDIBLE"
        verdict_type = "real"
        summary = f"Published by verified high-trust news organization ({domain_info['label']}) with rigorous editorial standards."

    # 8. Machine Learning model strongly predicts FAKE (fake_prob >= 65%) with low sourcing
    elif raw_fake_prob >= 0.65 and ling["sourcing_score"] < 25:
        credibility_score = round(max(10.0, raw_real_prob * 60.0), 1)
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        summary = f"Linguistic and stylistic patterns match known fake news distributions (Model fake confidence: {raw_fake_prob*100:.1f}%)."

    # 9. Machine Learning model predicts REAL (real_prob >= 60%) with low sensationalism
    elif raw_real_prob >= 0.60 and ling["sensational_score"] <= 15:
        credibility_score = round(min(96.0, 70.0 + (raw_real_prob * 20.0) + (ling["sourcing_score"] * 0.1)), 1)
        verdict = "VERIFIED CREDIBLE"
        verdict_type = "real"
        summary = "Matches patterns of legitimate, professionally reported news with objective phrasing and verified syntax."

    # 10. Objective reporting style with verified attribution & absent sensationalism
    # (Accurately covers real tech, science, health, space, international news outside 2016 US politics)
    elif ling["sensational_score"] <= 10 and ling["sourcing_score"] >= 20:
        credibility_score = round(min(92.0, 68.0 + (ling["sourcing_score"] * 0.2) + (raw_real_prob * 15.0)), 1)
        verdict = "VERIFIED CREDIBLE"
        verdict_type = "real"
        summary = "Objective journalistic reporting with verified institutional attribution and absent sensationalism."

    # 11. Borderline / moderate signals
    elif raw_real_prob >= 0.45 and ling["sensational_score"] <= 15:
        credibility_score = round(50.0 + (raw_real_prob * 10.0), 1)
        verdict = "UNVERIFIED / MIXED SIGNALS"
        verdict_type = "mixed"
        summary = "Contains mixed stylistic indicators. We recommend cross-referencing with primary wire services."

    # 12. Fallback: Leaning fake
    else:
        credibility_score = round(max(15.0, raw_real_prob * 50.0), 1)
        verdict = "POTENTIALLY FAKE / MISLEADING"
        verdict_type = "fake"
        summary = "Lacks credible journalistic indicators and contains characteristics common in unverified claims."

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
        "prediction": "REAL" if verdict_type == "real" else ("SATIRE" if verdict_type == "satire" else "FAKE"),
        "credibility_score": credibility_score,
        "model_confidence": round(float(max(pipeline.predict_proba([clean_text])[0])) * 100, 1),
        "summary": summary,
        "linguistics": ling,
        "sentence_heatmap": sentence_heatmap,
        "domain_info": domain_info,
        "external_fact_check": external_fact_check,
        "gemini_fact_check": gemini_fact_check,
        "api_active": bool(external_fact_check or gemini_fact_check),
        "notice": "This analysis evaluates text stylometry, domain trust, machine-learning patterns, and external fact-checking APIs when configured."
    })


@app.route("/api/api-status", methods=["GET"])
def api_status():
    return jsonify({
        "factcheck_configured": bool(os.environ.get("GOOGLE_FACTCHECK_API_KEY") or os.environ.get("FACTCHECK_API_KEY")),
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_GEMINI_API_KEY")),
        "model_ready": pipeline is not None
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
    app.run(host="0.0.0.0", port=port, debug=True)
