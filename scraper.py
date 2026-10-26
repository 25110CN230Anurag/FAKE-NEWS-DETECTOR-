"""
Web Article Scraper & Domain Credibility Analyzer for Veritas.
Extracts clean article content, metadata, and domain reputation
from any news outlet (Times of India, NDTV, BBC, Reuters, Hindu, etc.).
"""

import re
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
from training_data import TRUSTED_DOMAINS, SUSPICIOUS_DOMAINS

# Browser-like headers to avoid anti-bot blocks
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/"
}

class VeritasScraper:
    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    def extract_domain(self, url: str) -> str:
        """Extracts clean domain name from URL."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return ""

    def evaluate_domain_trust(self, domain: str) -> dict:
        """
        Determines the credibility score and tier of the publisher domain.
        Recognizes Indian and international news platforms.
        """
        domain_clean = domain.lower().replace("www.", "")

        # Exact match or subdomain match in trusted domains
        for trusted_key, data in TRUSTED_DOMAINS.items():
            if domain_clean == trusted_key or domain_clean.endswith("." + trusted_key):
                return {
                    "domain": domain_clean,
                    "publisher_name": data["name"],
                    "trust_score": data["trust_score"],
                    "category": data["category"],
                    "status": "Verified Trusted Publisher",
                    "badge_color": "emerald"
                }

        # Check in suspicious / satirical domains
        for suspicious_key, data in SUSPICIOUS_DOMAINS.items():
            if domain_clean == suspicious_key or domain_clean.endswith("." + suspicious_key):
                return {
                    "domain": domain_clean,
                    "publisher_name": data["name"],
                    "trust_score": data["trust_score"],
                    "category": data["category"],
                    "status": "High Risk / Satire / Propaganda",
                    "badge_color": "rose"
                }

        # Heuristic scoring for unknown domains
        base_trust = 55
        status = "Unindexed / Independent Source"
        badge_color = "amber"

        if domain_clean.endswith(".gov") or domain_clean.endswith(".gov.in") or domain_clean.endswith(".nic.in"):
            base_trust = 98
            status = "Official Government Portal"
            badge_color = "emerald"
        elif domain_clean.endswith(".edu") or domain_clean.endswith(".ac.in"):
            base_trust = 92
            status = "Accredited Academic Institution"
            badge_color = "emerald"
        elif any(domain_clean.endswith(tld) for tld in [".xyz", ".top", ".buzz", ".click", ".tk", ".cf", ".club"]):
            base_trust = 25
            status = "Low-Reputation / Suspicious TLD"
            badge_color = "rose"

        return {
            "domain": domain_clean or "raw_text_input",
            "publisher_name": domain_clean.capitalize() if domain_clean else "Direct Input",
            "trust_score": base_trust,
            "category": "web_source",
            "status": status,
            "badge_color": badge_color
        }

    def scrape_url(self, url: str) -> dict:
        """
        Fetches and cleans article text from any target URL.
        Handles TOI, NDTV, and standard news sites with fallback extractors.
        """
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        domain = self.extract_domain(url)
        domain_info = self.evaluate_domain_trust(domain)

        try:
            response = requests.get(url, headers=DEFAULT_HEADERS, timeout=self.timeout)
            response.raise_for_status()
            html = response.text
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Failed to fetch webpage ({str(e)})",
                "domain_info": domain_info,
                "url": url
            }

        soup = BeautifulSoup(html, "html.parser")

        # Remove noise elements (scripts, styles, ads, comments, nav, footer)
        for noise in soup(["script", "style", "nav", "footer", "aside", "noscript", "header", "form"]):
            noise.decompose()

        # 1. Title Extraction
        title = ""
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()
        elif soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("h1"):
            title = soup.find("h1").get_text().strip()

        # Clean title suffix (e.g., "- Times of India", "| NDTV")
        title = re.sub(r"\s*[-|–]\s*(The Times of India|NDTV|The Hindu|BBC News|Hindustan Times).*$", "", title, flags=re.IGNORECASE)

        # 2. Author Extraction
        author = "Editorial Desk"
        author_meta = soup.find("meta", attrs={"name": re.compile(r"author", re.I)})
        if author_meta and author_meta.get("content"):
            author = author_meta["content"].strip()

        # 3. Publish Date Extraction
        publish_date = "Recent"
        date_meta = soup.find("meta", property="article:published_time") or soup.find("meta", attrs={"name": re.compile(r"date|pubdate", re.I)})
        if date_meta and date_meta.get("content"):
            publish_date = date_meta["content"].split("T")[0]

        # 4. Article Body Content Extraction
        # Look for news-specific containers
        content = ""
        article_tag = (
            soup.find("article") or
            soup.find("div", class_=re.compile(r"article-body|story-body|_s30J|content_area|story__body", re.I)) or
            soup.find("div", id=re.compile(r"article-body|story-content", re.I))
        )

        paragraphs = []
        if article_tag:
            paragraphs = [p.get_text().strip() for p in article_tag.find_all("p") if len(p.get_text().strip()) > 30]

        if not paragraphs:
            # Fallback to general paragraph collection
            paragraphs = [p.get_text().strip() for p in soup.find_all("p") if len(p.get_text().strip()) > 40]

        # Filter out common junk
        cleaned_paragraphs = []
        for p in paragraphs:
            if re.search(r"subscribe|advertisement|copyright|follow us on|read more|all rights reserved", p, re.I):
                continue
            cleaned_paragraphs.append(p)

        content = " ".join(cleaned_paragraphs[:15])  # Cap at top 15 rich paragraphs

        # If still empty, use meta description
        if not content:
            meta_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                content = meta_desc["content"].strip()

        if not content:
            return {
                "success": False,
                "error": "Could not extract readable article text from this page. Try pasting the article text directly.",
                "domain_info": domain_info,
                "url": url,
                "title": title
            }

        return {
            "success": True,
            "url": url,
            "domain": domain,
            "domain_info": domain_info,
            "title": title,
            "author": author,
            "publish_date": publish_date,
            "content": content,
            "word_count": len(content.split())
        }

scraper = VeritasScraper()

if __name__ == "__main__":
    # Test domain reputation
    print("NDTV Trust:", scraper.evaluate_domain_trust("ndtv.com"))
    print("TOI Trust:", scraper.evaluate_domain_trust("timesofindia.indiatimes.com"))
    print("Unknown Trust:", scraper.evaluate_domain_trust("fake-breaking-news.xyz"))
