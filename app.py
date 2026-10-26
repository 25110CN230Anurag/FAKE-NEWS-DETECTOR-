"""
Flask Web Application for Veritas - AI Fake News & Veracity Verification System.
Serves the web dashboard, REST APIs, and interactive project presentation.
"""

import os
from flask import Flask, render_template, request, jsonify
from fact_checker import fact_checker
from scraper import scraper

app = Flask(__name__)

# Preset test cases for instantaneous interactive testing
SAMPLE_CASES = [
    {
        "id": "sample_real_isro",
        "title": "ISRO Chandrayaan-3 Moon Mission",
        "type": "Genuine National News",
        "publisher": "The Times of India",
        "url": "",
        "text": "ISRO successfully launched the Chandrayaan-3 lunar exploration mission from the Satish Dhawan Space Centre in Sriharikota. The spacecraft entered the lunar transfer trajectory and achieved a historic soft landing on the south pole of the Moon. Prime Minister and global space agencies congratulated the Indian space research team for this momentous technological milestone.",
        "expected": "Authentic (85-98%)"
    },
    {
        "id": "sample_real_rbi",
        "title": "RBI Repo Rate Policy Announcement",
        "type": "Economic & Financial Report",
        "publisher": "NDTV Profit",
        "url": "",
        "text": "The Reserve Bank of India has decided to leave the benchmark repo rate unchanged at 6.50 percent in its latest Monetary Policy Committee meeting. RBI Governor stated that headline retail inflation continues to moderate towards the targeted band, while domestic economic growth remains resilient amidst global headwinds.",
        "expected": "Authentic (85-95%)"
    },
    {
        "id": "sample_fake_unesco",
        "title": "UNESCO Best National Anthem Hoax",
        "type": "Viral WhatsApp Forward",
        "publisher": "Unknown Social Media Forward",
        "url": "",
        "text": "SHOCKING NEWS: UNESCO has officially declared the Indian National Anthem Jana Gana Mana as the best and most patriotic national anthem in the entire world! Forward this message to all your groups and friends immediately to show your national pride before midnight!",
        "expected": "Fake / Hoax (10-25%)"
    },
    {
        "id": "sample_fake_gps",
        "title": "Nano GPS Chip in 2000 Rupee Note",
        "type": "Currency Disinformation",
        "publisher": "Viral WhatsApp Post",
        "url": "",
        "text": "BREAKING: Reserve Bank of India has embedded secret nano-GPS tracking microchips inside every new 2000 rupee currency note. These satellites can track black money and hidden cash stashes located even 120 meters underground without any battery required!",
        "expected": "Fabricated Disinformation (5-15%)"
    },
    {
        "id": "sample_fake_cure",
        "title": "Boiled Lemon Cures Cancer in 24 Hours",
        "type": "Dangerous Health Myth",
        "publisher": "Alternative Health Blog",
        "url": "",
        "text": "SECRET CURE REVEALED: Drinking hot lemon juice mixed with two spoons of baking soda kills 100% of cancer cells and eliminates all viral infections within 24 hours! Big pharmaceutical companies and corrupt doctors are trying to ban this video from the internet to protect profits!",
        "expected": "Medical Scam / Dangerous (5-20%)"
    }
]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/presentation")
def presentation():
    return render_template("presentation.html")

@app.route("/api/samples", methods=["GET"])
def get_samples():
    return jsonify({"success": True, "samples": SAMPLE_CASES})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json() or {}
    url = data.get("url", "").strip()
    text = data.get("text", "").strip()

    if not url and not text:
        return jsonify({"success": False, "error": "Please provide an article URL or paste news text."}), 400

    try:
        result = fact_checker.verify_news(text=text, url=url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": f"Analysis error: {str(e)}"}), 500

@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify({
        "status": "online",
        "model_version": "Veritas-NLP-v2.4",
        "features": [
            "Passive-Aggressive & Logistic ML Inference",
            "Stylometric Clickbait & Sensationalism Forensics",
            "Live Web News Cross-Referencing",
            "Domain Credibility & Publisher Reputation Index",
            "Sentence-Level Atomic Claim Extraction"
        ],
        "supported_publishers": [
            "The Times of India", "NDTV", "The Hindu", "The Indian Express",
            "Hindustan Times", "PIB Fact Check", "BBC News", "Reuters", "AP News"
        ]
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Veritas Server] Running on http://0.0.0.0:{port} ...")
    app.run(host="0.0.0.0", port=port, debug=False)
