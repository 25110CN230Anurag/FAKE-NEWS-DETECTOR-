"""
Machine Learning & Stylometric NLP Engine for Veritas Fake News Detector.
Combines TF-IDF N-Gram Vectorization, Passive-Aggressive / Logistic Classifiers,
and heuristic stylometric decomposition.
"""

import os
import re
import math
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier, LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from training_data import DATASET

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "fake_news_model.joblib")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")

# Sensationalist, clickbait, and panic-inducing patterns
SENSATIONAL_PATTERNS = [
    r"\bshocking\b", r"\bunbelievable\b", r"\bmiracle\b", r"\bsecret cure\b",
    r"\bexposed\b", r"\bbombshell\b", r"\burgent warning\b", r"\bforward this\b",
    r"\bshare before it gets deleted\b", r"\bhurry up\b", r"\bshare on 10\b",
    r"\bdoctors are hiding\b", r"\bconspiracy\b", r"\bcovert military\b",
    r"\bexplosive revelation\b", r"\bthey don't want you to know\b",
    r"\bban this link\b", r"\b100% guaranteed\b", r"\bovernight cure\b",
    r"\bbreaking alert\b", r"\bact fast\b", r"\bfree recharge\b"
]

CREDIBILITY_MARKERS = [
    r"\baccording to\b", r"\bofficial statement\b", r"\bspokesperson\b",
    r"\bministry of\b", r"\bresearchers found\b", r"\bpublished in\b",
    r"\bpress release\b", r"\bdata released by\b", r"\bsupreme court\b",
    r"\bhigh court\b", r"\bconfirmed by\b", r"\breport stated\b",
    r"\bgovernment official\b", r"\bregulatory authority\b"
]

class VeritasMLEngine:
    def __init__(self):
        self.vectorizer = None
        self.classifier = None
        self._initialize_model()

    def _initialize_model(self):
        """Loads pre-trained model or trains a new one using the training corpus."""
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            try:
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self.classifier = joblib.load(MODEL_PATH)
                return
            except Exception as e:
                print(f"[VeritasML] Reloading due to: {e}")

        # Train new calibrated classifier
        texts = [item["text"] for item in DATASET]
        labels = [item["label"] for item in DATASET]

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=5000,
            stop_words='english'
        )
        X = self.vectorizer.fit_transform(texts)
        
        # Calibrated classifier for smooth probabilistic output
        base_clf = LogisticRegression(C=1.5, max_iter=500, random_state=42)
        self.classifier = CalibratedClassifierCV(estimator=base_clf, cv=3)
        self.classifier.fit(X, labels)

        try:
            joblib.dump(self.classifier, MODEL_PATH)
            joblib.dump(self.vectorizer, VECTORIZER_PATH)
        except Exception as e:
            print(f"[VeritasML] Warning: Could not save model to disk: {e}")

    def analyze_linguistics(self, text: str) -> dict:
        """Extracts stylometric, clickbait, and emotional markers from text."""
        cleaned = text.strip()
        words = re.findall(r'\b\w+\b', cleaned)
        total_words = max(len(words), 1)

        # 1. Capitalization intensity (words in ALL CAPS of length >= 3)
        all_caps_words = [w for w in words if len(w) >= 3 and w.isupper()]
        caps_ratio = min(round((len(all_caps_words) / total_words) * 100, 1), 100.0)

        # 2. Exclamation & question mark count
        exclamations = cleaned.count("!")
        questions = cleaned.count("?")
        punctuation_intensity = min(round(((exclamations * 2 + questions) / max(total_words / 15, 1)) * 10, 1), 100.0)

        # 3. Sensationalism & Clickbait matching
        text_lower = cleaned.lower()
        flagged_words = []
        sensational_hits = 0
        for pattern in SENSATIONAL_PATTERNS:
            matches = re.findall(pattern, text_lower)
            if matches:
                sensational_hits += len(matches)
                clean_term = pattern.replace(r"\b", "").replace("\\", "")
                flagged_words.append(clean_term)

        sensationalism_score = min(round((sensational_hits * 22) + (caps_ratio * 0.4) + (punctuation_intensity * 0.4), 1), 100.0)

        # 4. Credibility & Journalistic attribution matching
        credibility_hits = 0
        found_credibility_markers = []
        for pattern in CREDIBILITY_MARKERS:
            matches = re.findall(pattern, text_lower)
            if matches:
                credibility_hits += len(matches)
                clean_term = pattern.replace(r"\b", "").replace("\\", "")
                found_credibility_markers.append(clean_term)

        journalistic_formality = min(round(35 + (credibility_hits * 18) - (sensationalism_score * 0.3), 1), 100.0)
        journalistic_formality = max(5.0, journalistic_formality)

        # Tone categorization
        if sensationalism_score >= 50 or caps_ratio > 20:
            emotional_tone = "Alarmist / Clickbait"
        elif journalistic_formality >= 65:
            emotional_tone = "Objective / Journalistic"
        else:
            emotional_tone = "Informal / Unverified"

        return {
            "sensationalism_score": sensationalism_score,
            "caps_ratio": caps_ratio,
            "punctuation_intensity": punctuation_intensity,
            "journalistic_formality": journalistic_formality,
            "emotional_tone": emotional_tone,
            "flagged_keywords": flagged_words[:8],
            "credibility_markers": found_credibility_markers[:6]
        }

    def predict(self, text: str) -> dict:
        """
        Predicts whether text exhibits authentic journalistic patterns or fake news features.
        Returns probability of truthfulness (0-100%).
        """
        if not text or not text.strip():
            return {
                "truth_probability": 50.0,
                "label": "UNCERTAIN",
                "linguistics": self.analyze_linguistics("")
            }

        linguistics = self.analyze_linguistics(text)
        
        # ML Model Inference
        X = self.vectorizer.transform([text])
        proba = self.classifier.predict_proba(X)[0]
        # Class 1 is REAL, Class 0 is FAKE
        raw_ml_truth = float(proba[1]) * 100.0

        # Adjust with stylometric heuristics:
        # Sensational clickbait heavily dampens credibility; formal attribution boosts it.
        stylometric_truth = (
            (100.0 - linguistics["sensationalism_score"]) * 0.6 +
            linguistics["journalistic_formality"] * 0.4
        )

        blended_truth = (raw_ml_truth * 0.65) + (stylometric_truth * 0.35)
        blended_truth = max(2.0, min(99.0, round(blended_truth, 1)))

        label = "REAL" if blended_truth >= 50.0 else "FAKE"

        return {
            "ml_raw_score": round(raw_ml_truth, 1),
            "truth_probability": blended_truth,
            "label": label,
            "linguistics": linguistics
        }

# Global singleton
ml_engine = VeritasMLEngine()

if __name__ == "__main__":
    test_real = "The Reserve Bank of India has maintained repo rate unchanged according to official monetary policy committee statement."
    test_fake = "SHOCKING: NASA confirms total darkness for 15 days! Share this immediately before government bans it!"
    
    print("Real Test Result:", ml_engine.predict(test_real))
    print("Fake Test Result:", ml_engine.predict(test_fake))
