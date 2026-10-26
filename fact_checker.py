"""
Multi-Claim Verification & Fact-Checking Engine for Veritas.
Extracts individual claims from news articles, cross-references against live news,
checks debunk signatures, and calculates overall Veracity Percentage.
"""

import re
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from training_data import DEBUNKED_SIGNATURES, TRUSTED_DOMAINS
from ml_engine import ml_engine
from scraper import scraper

class VeritasFactChecker:
    def __init__(self, timeout: int = 6):
        self.timeout = timeout

    def split_into_claims(self, text: str) -> list[str]:
        """
        Deconstructs text into atomic factual statements/claims.
        Filters out rhetorical questions, greetings, or short fragments.
        """
        # Split on sentence boundaries (period, exclamation, newline)
        raw_sentences = re.split(r'(?<=[.!?\n])\s+', text)
        claims = []
        for s in raw_sentences:
            cleaned = s.strip()
            # Must be at least 25 characters and contain more than 4 words
            words = cleaned.split()
            if len(cleaned) >= 25 and len(words) >= 5:
                # Exclude purely greeting or boilerplate sentences
                if re.match(r'^(hello|hi|welcome|click here|read more|subscribe|share this|follow us)', cleaned, re.I):
                    continue
                claims.append(cleaned)

        # Cap at top 8 most prominent claims for focused analysis
        return claims[:8] if claims else [text.strip()[:200]]

    def match_debunk_database(self, claim: str) -> dict | None:
        """
        Checks if the claim matches known widespread hoaxes or verified debunks.
        Uses fuzzy token overlap as well as substring matching.
        """
        claim_lower = claim.lower()
        claim_words = set(re.findall(r'\b\w+\b', claim_lower))

        for item in DEBUNKED_SIGNATURES:
            matched_count = 0
            for kw in item["keywords"]:
                # Direct substring match
                if kw in claim_lower:
                    matched_count += 1
                else:
                    # Token set match (all words in the keyword phrase are present)
                    kw_words = set(re.findall(r'\b\w+\b', kw))
                    if kw_words and kw_words.issubset(claim_words):
                        matched_count += 1

            if matched_count >= 1:
                return {
                    "matched": True,
                    "topic": item["topic"],
                    "verdict": item["verdict"],
                    "debunked_by": item["debunked_by"],
                    "fact": item["fact"]
                }
        return None

    def search_live_corroboration(self, query: str) -> list[dict]:
        """
        Cross-references the claim or headline across Google News RSS feed
        to find corroborating coverage from accredited media organizations.
        Works without any external API keys.
        """
        # Simplify query to 5-7 key informative words for better search recall
        words = re.findall(r'\b[A-Za-z0-9]{3,}\b', query)
        filtered = [w for w in words if w.lower() not in {
            'this', 'that', 'with', 'from', 'have', 'were', 'what', 'when',
            'will', 'says', 'said', 'they', 'their', 'about', 'shocking', 'breaking'
        }]
        search_terms = " ".join(filtered[:6])
        if not search_terms:
            search_terms = query[:40]

        encoded_query = urllib.parse.quote(search_terms)
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 VeritasNewsEngine/1.0"
        }

        found_sources = []
        try:
            resp = requests.get(rss_url, headers=headers, timeout=self.timeout)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                for item in root.findall(".//item")[:5]:
                    item_title = item.find("title").text if item.find("title") is not None else ""
                    item_link = item.find("link").text if item.find("link") is not None else ""
                    item_source = item.find("source").text if item.find("source") is not None else "News Source"
                    item_date = item.find("pubDate").text if item.find("pubDate") is not None else ""

                    # Check if the title mentions debunking terms
                    is_debunk_report = bool(re.search(r'\b(fact[- ]check|fake|false|hoax|myth|busted|debunked|misleading)\b', item_title, re.I))

                    # Check source trust
                    source_lower = item_source.lower()
                    is_trusted = any(td in source_lower for td in ["times of india", "ndtv", "hindu", "express", "reuters", "bbc", "pib", "ani", "pti"])

                    found_sources.append({
                        "title": item_title,
                        "source": item_source,
                        "link": item_link,
                        "date": item_date[:16] if item_date else "",
                        "is_debunk": is_debunk_report,
                        "is_trusted": is_trusted
                    })
        except Exception as e:
            # Silently degrade if network issue occurs
            pass

        return found_sources

    def evaluate_claim(self, claim: str, domain_trust: int) -> dict:
        """
        Analyzes a single claim:
        - Debunk signature lookup
        - Stylometric/ML evaluation
        - Live search corroboration
        """
        # 1. Direct Debunk Check
        debunk_hit = self.match_debunk_database(claim)
        if debunk_hit:
            return {
                "claim": claim,
                "truth_score": 5.0,
                "status": "Fabricated / Debunked",
                "badge_color": "rose",
                "reason": f"Matches verified hoax flagged by {debunk_hit['debunked_by']}: {debunk_hit['fact']}",
                "corroborated": False,
                "evidence_type": "Debunk Database"
            }

        # 2. Linguistic & Stylistic check for this claim
        ling = ml_engine.analyze_linguistics(claim)
        
        # 3. Live Corroboration Check
        live_sources = self.search_live_corroboration(claim)
        
        # Check if live sources contain debunks
        debunk_articles = [s for s in live_sources if s["is_debunk"]]
        trusted_reports = [s for s in live_sources if s["is_trusted"] and not s["is_debunk"]]

        if debunk_articles:
            score = 15.0
            status = "Flagged as False by Media"
            badge_color = "rose"
            reason = f"Fact-checking articles detected: '{debunk_articles[0]['title']}' by {debunk_articles[0]['source']}."
            corroborated = False
        elif trusted_reports:
            score = min(96.0, 75.0 + (len(trusted_reports) * 7.0))
            status = "Verified by Mainstream Media"
            badge_color = "emerald"
            reason = f"Corroborated by reports from {trusted_reports[0]['source']} ('{trusted_reports[0]['title']}')."
            corroborated = True
        elif live_sources:
            score = 65.0
            status = "Partially Corroborated"
            badge_color = "amber"
            reason = f"Related news coverage found on {live_sources[0]['source']}, but official verification pending."
            corroborated = True
        else:
            # No live search results: rely on linguistic tone and domain trust
            if ling["sensationalism_score"] > 40:
                score = max(10.0, 45.0 - ling["sensationalism_score"])
                status = "Unsubstantiated / Sensational"
                badge_color = "rose"
                reason = "No corroborating reports found; text contains high sensationalism and clickbait markers."
            elif domain_trust >= 85:
                score = 82.0
                status = "Credible Publisher Assertion"
                badge_color = "emerald"
                reason = "Reported by high-authority news publisher with standard journalistic attribution."
            else:
                score = 50.0
                status = "Unverified Claim"
                badge_color = "slate"
                reason = "No independent corroboration found in news archives; requires manual verification."
            corroborated = False

        return {
            "claim": claim,
            "truth_score": round(score, 1),
            "status": status,
            "badge_color": badge_color,
            "reason": reason,
            "corroborated": corroborated,
            "evidence_type": "Live News Corroboration" if live_sources else "Stylometric & Domain Analysis"
        }

    def verify_news(self, text: str = "", url: str = "") -> dict:
        """
        Complete verification pipeline:
        1. Ingests text or scrapes URL
        2. Performs ML Stylometric analysis
        3. Extracts atomic claims and checks each one
        4. Queries live sources for corroboration
        5. Computes composite Truth Percentage with weighted factors
        """
        article_meta = {}
        domain_trust = 55
        target_text = text.strip()

        # Step 1: Scrape if URL is provided
        if url and url.strip():
            scrape_res = scraper.scrape_url(url.strip())
            if not scrape_res.get("success"):
                return {
                    "success": False,
                    "error": scrape_res.get("error", "Failed to retrieve URL content"),
                    "domain_info": scrape_res.get("domain_info", {})
                }
            article_meta = {
                "title": scrape_res.get("title", ""),
                "author": scrape_res.get("author", "Editorial"),
                "date": scrape_res.get("publish_date", "Recent"),
                "domain": scrape_res.get("domain", ""),
                "domain_info": scrape_res.get("domain_info", {}),
                "url": url
            }
            target_text = f"{scrape_res.get('title', '')}. {scrape_res.get('content', '')}".strip()
            domain_trust = scrape_res.get("domain_info", {}).get("trust_score", 55)
        else:
            article_meta = {
                "title": target_text[:90] + ("..." if len(target_text) > 90 else ""),
                "author": "Direct Input",
                "date": "Today",
                "domain": "Direct Text Submission",
                "domain_info": {
                    "publisher_name": "User Submission",
                    "trust_score": 50,
                    "status": "Direct Text Input",
                    "badge_color": "slate"
                },
                "url": ""
            }

        if not target_text:
            return {"success": False, "error": "No news text or URL provided."}

        # Step 2: Global ML & Stylometric Inference
        ml_prediction = ml_engine.predict(target_text)
        ml_truth = ml_prediction["truth_probability"]
        linguistics = ml_prediction["linguistics"]

        # Step 3: Deconstruct into claims and verify each claim
        claims = self.split_into_claims(target_text)
        evaluated_claims = []
        for c in claims:
            evaluated_claims.append(self.evaluate_claim(c, domain_trust))

        # Calculate average claim truth score
        claims_truth_avg = sum(c["truth_score"] for c in evaluated_claims) / max(len(evaluated_claims), 1)

        # Step 4: Live Overall Topic Corroboration
        search_query = article_meta.get("title") or (claims[0] if claims else target_text[:80])
        live_coverage = self.search_live_corroboration(search_query)

        # Calculate live corroboration bonus / penalty
        trusted_mentions = [s for s in live_coverage if s["is_trusted"]]
        debunk_mentions = [s for s in live_coverage if s["is_debunk"]]

        if debunk_mentions:
            corroboration_score = 10.0
        elif len(trusted_mentions) >= 2:
            corroboration_score = 95.0
        elif live_coverage:
            corroboration_score = 70.0
        else:
            corroboration_score = 50.0

        # Step 5: Composite Veracity Percentage Calculation
        # Weights:
        # - Claims Truth Ratio: 35%
        # - ML Stylometric Authenticity: 30%
        # - Domain / Publisher Authority: 20%
        # - Live Corroboration: 15%
        raw_composite = (
            (claims_truth_avg * 0.35) +
            (ml_truth * 0.30) +
            (domain_trust * 0.20) +
            (corroboration_score * 0.15)
        )

        # Apply critical penalties: If debunked or high sensationalism
        if any(c["truth_score"] <= 15.0 for c in evaluated_claims):
            raw_composite = min(raw_composite, 18.0)
        elif linguistics["sensationalism_score"] >= 45:
            raw_composite = min(raw_composite, 30.0)
        elif debunk_mentions:
            raw_composite = min(raw_composite, 22.0)

        final_truth_percentage = max(1.0, min(99.0, round(raw_composite, 1)))

        # Determine Verdict & Tier
        if final_truth_percentage >= 82.0:
            verdict = "VERIFIED AUTHENTIC"
            verdict_badge = "emerald"
            verdict_desc = "High degree of journalistic integrity, verifiable claims, and reputable reporting style."
        elif final_truth_percentage >= 65.0:
            verdict = "MOSTLY ACCURATE"
            verdict_badge = "teal"
            verdict_desc = "Content is largely substantiated by credible facts, with minor unverified details."
        elif final_truth_percentage >= 45.0:
            verdict = "MIXED / UNCONFIRMED"
            verdict_badge = "amber"
            verdict_desc = "Contains a mixture of accurate statements and unsubstantiated claims. Cross-verification recommended."
        elif final_truth_percentage >= 25.0:
            verdict = "QUESTIONABLE / MISLEADING"
            verdict_badge = "orange"
            verdict_desc = "Lacks credible evidence, contains emotional hyperbole, or selectively misrepresents facts."
        else:
            verdict = "FABRICATED / FAKE NEWS"
            verdict_badge = "rose"
            verdict_desc = "Critical indicators of disinformation, debunked hoaxes, or fraudulent health/political claims."

        # Compute count of true vs false claims
        true_claims_count = sum(1 for c in evaluated_claims if c["truth_score"] >= 70.0)
        mixed_claims_count = sum(1 for c in evaluated_claims if 35.0 <= c["truth_score"] < 70.0)
        false_claims_count = sum(1 for c in evaluated_claims if c["truth_score"] < 35.0)

        return {
            "success": True,
            "article": article_meta,
            "veracity_percentage": final_truth_percentage,
            "verdict": verdict,
            "verdict_badge": verdict_badge,
            "verdict_description": verdict_desc,
            "claim_counts": {
                "total": len(evaluated_claims),
                "true_claims": true_claims_count,
                "mixed_claims": mixed_claims_count,
                "false_claims": false_claims_count
            },
            "claims": evaluated_claims,
            "corroboration_sources": live_coverage[:4],
            "metrics": {
                "claims_truth_ratio": round(claims_truth_avg, 1),
                "ml_authenticity_score": ml_truth,
                "publisher_trust_score": domain_trust,
                "live_corroboration_score": round(corroboration_score, 1),
                "sensationalism_index": linguistics["sensationalism_score"],
                "journalistic_formality": linguistics["journalistic_formality"],
                "emotional_tone": linguistics["emotional_tone"],
                "flagged_keywords": linguistics["flagged_keywords"]
            }
        }

fact_checker = VeritasFactChecker()

if __name__ == "__main__":
    test_claim = "UNESCO declares Indian National Anthem as best anthem in the world. Share immediately!"
    res = fact_checker.verify_news(text=test_claim)
    print("Verification Verdict:", res["verdict"], f"({res['veracity_percentage']}%)")
    print("Claims:", res["claims"])
