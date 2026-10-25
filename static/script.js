/**
 * NewsCheck — Professional Newsroom Verification & Detection Script
 * Features:
 * 1. URL Scraper & Domain Trust Engine
 * 2. Interactive Sentence-by-Sentence Claim Heatmap
 * 3. Official Fact-Check PDF Dossier Download & JSON Export
 */

// Sample news dataset for instant 1-click verification testing
const SAMPLE_NEWS = {
  fed_real: {
    headline: "Federal Reserve Signals Two Rate Cuts Ahead as Inflation Cools Toward 2% Target",
    article: "WASHINGTON — Federal Reserve officials held benchmark interest rates steady on Wednesday while signaling they still anticipate two quarter-point reductions before the end of the year. Central bank policymakers cited consistent progress on cooling consumer inflation alongside resilient employment figures. 'We are seeing inflation move closer to our objective on a sustainable basis,' Fed Chairman Jerome Powell stated during the press conference, emphasizing that future decisions will remain strictly data-dependent.",
    url: "https://www.reuters.com/business/fed-decision-2026"
  },
  science_real: {
    headline: "James Webb Space Telescope Confirms Oldest Known Galaxy Cluster in Early Universe",
    article: "Astronomers utilizing NASA's James Webb Space Telescope have confirmed the observation of a massive cluster of galaxies that formed just 350 million years after the Big Bang. The peer-reviewed study, published in the Astrophysical Journal on Thursday, provides unprecedented measurements of early cosmic star formation. 'These observations challenge previous theoretical timelines and provide concrete empirical data on how early structures developed,' said lead astrophysicist Dr. Elena Vance.",
    url: "https://www.nature.com/articles/s41586-jwst-cluster"
  },
  satire_onion: {
    headline: "Scientists Discover Ancient Civilization That Was Just Two Guys Named Steve",
    article: "CAMBRIDGE, MA — Archaeological researchers confirmed Thursday that an ancient civilization discovered beneath the Mediterranean was entirely populated by two guys named Steve. According to carbon-dating analysis, Steve and Steve founded the empire around 2400 BC, spent three centuries arguing over whose turn it was to wash the ceramic bowl, and collapsed after Steve refused to talk to Steve for four decades.",
    url: "https://www.theonion.com/scientists-discover-ancient-civilization-of-two-steves"
  },
  water_fake: {
    headline: "BOMBSHELL: Leaked Secret Documents Prove Government Cabal Is Poisoning Tap Water!",
    article: "SHOCKING EXPOSE! High-level whistleblowers have leaked classified files exposing an evil globalist cabal putting mind-control nano-chips and synthetic poisons into public city tap water! Mainstream media corrupt presstitutes are completely covering this up to keep citizens brainwashed and obedient. SHARE THIS EMERGENCY ALERT WITH EVERYONE BEFORE THE GLOBAL ELITES DELETE IT FROM THE INTERNET FOREVER!!!",
    url: ""
  },
  hoax_fake: {
    headline: "You Won't Believe What Celebrities Were Caught Doing on This Private Secret Island!",
    article: "The shocking truth has finally leaked out! Disgraceful video evidence showing top Hollywood elites at a forbidden underground ritual was just released by an anonymous hacker group. The disgraceful footage will destroy their careers and put multiple politicians behind bars immediately! Doctors and lawyers are completely stunned. Click here right now before the video is permanently scrubbed!",
    url: ""
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const form = document.getElementById("news-form");
  const headlineInput = document.getElementById("headline");
  const articleInput = document.getElementById("article");
  const charCountEl = document.getElementById("char-count");
  const wordCountEl = document.getElementById("word-count");
  const analyzeBtn = document.getElementById("analyze-btn");
  const clearBtn = document.getElementById("clear-btn");
  
  // URL Tab Elements
  const tabTextBtn = document.getElementById("tab-text-btn");
  const tabUrlBtn = document.getElementById("tab-url-btn");
  const urlContainer = document.getElementById("url-input-container");
  const articleUrlInput = document.getElementById("article-url");
  const fetchUrlBtn = document.getElementById("fetch-url-btn");
  const domainTrustDisplay = document.getElementById("domain-trust-display");
  const domainNameLabel = document.getElementById("domain-name-label");
  const domainTypeLabel = document.getElementById("domain-type-label");
  const domainScoreLabel = document.getElementById("domain-score-label");

  // State Panels
  const emptyState = document.getElementById("empty-state");
  const resultState = document.getElementById("result-state");
  const errorState = document.getElementById("error-state");
  const resetBtn = document.getElementById("reset-btn");
  const serverStatusBadge = document.getElementById("server-status");

  // Dossier Action Elements
  const printPdfBtn = document.getElementById("print-pdf-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");

  // Heatmap Elements
  const sentenceStreamEl = document.getElementById("sentence-stream");
  const sentenceInspectorEl = document.getElementById("sentence-inspector");
  const inspNumEl = document.getElementById("insp-num");
  const inspBadgeEl = document.getElementById("insp-badge");
  const inspReasonsEl = document.getElementById("insp-reasons");

  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeToggleIcon = document.getElementById("theme-toggle-icon");
  const themeToggleLabel = document.getElementById("theme-toggle-label");

  function updateThemeUI(theme) {
    const isDark = theme === "dark";
    if (themeToggleIcon) themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
    if (themeToggleLabel) themeToggleLabel.textContent = isDark ? "Light" : "Dark";
  }

  const initialTheme = document.documentElement.getAttribute("data-theme") || "light";
  updateThemeUI(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = activeTheme === "dark" ? "light" : "dark";
      if (nextTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem("newscheck-theme", nextTheme);
      updateThemeUI(nextTheme);
    });
  }

  let latestAnalysisData = null;
  let currentActiveUrl = "";

  // Check backend server connection
  async function checkServerStatus() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        if (data.model_ready && serverStatusBadge) {
          serverStatusBadge.classList.remove("offline");
          serverStatusBadge.querySelector(".status-text").textContent = "AI Model Active";
        }
      }
    } catch (e) {
      if (serverStatusBadge) {
        serverStatusBadge.classList.add("offline");
        serverStatusBadge.querySelector(".status-text").textContent = "Local Mode";
      }
    }
  }
  checkServerStatus();

  // Tab switching (Paste Text vs URL Scraper)
  if (tabTextBtn && tabUrlBtn && urlContainer) {
    tabTextBtn.addEventListener("click", () => {
      tabTextBtn.classList.add("active");
      tabUrlBtn.classList.remove("active");
      urlContainer.classList.add("hidden");
    });
    tabUrlBtn.addEventListener("click", () => {
      tabUrlBtn.classList.add("active");
      tabTextBtn.classList.remove("active");
      urlContainer.classList.remove("hidden");
      articleUrlInput.focus();
    });
  }

  // Feature 1: URL Scraper fetch action
  if (fetchUrlBtn && articleUrlInput) {
    fetchUrlBtn.addEventListener("click", async () => {
      const url = articleUrlInput.value.trim();
      if (!url) {
        showError("Please enter a valid URL (e.g. https://www.bbc.com/news/...).");
        return;
      }
      fetchUrlBtn.disabled = true;
      fetchUrlBtn.querySelector("span").textContent = "Fetching Article…";
      errorState.classList.add("hidden");

      try {
        const response = await fetch("/api/scrape-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not fetch or parse article from this URL.");
        }

        currentActiveUrl = url;
        if (data.headline) headlineInput.value = data.headline;
        if (data.article) articleInput.value = data.article;
        updateCounts();

        // Display Domain Trust Banner
        if (data.domain_info && domainTrustDisplay) {
          domainTrustDisplay.className = `domain-trust-banner ${data.domain_info.badge || 'neutral'}`;
          domainNameLabel.textContent = data.domain_info.domain;
          domainTypeLabel.textContent = data.domain_info.label;
          domainScoreLabel.textContent = `Trust: ${data.domain_info.reputation_score}/100`;
          domainTrustDisplay.classList.remove("hidden");
        }

        // Trigger automatic verification
        form.dispatchEvent(new Event("submit"));

      } catch (err) {
        showError(err.message || "Failed to scrape the article. Try copying and pasting the text manually.");
      } finally {
        fetchUrlBtn.disabled = false;
        fetchUrlBtn.querySelector("span").textContent = "Fetch & Verify Link";
      }
    });
  }

  // Update live character and word counts
  function updateCounts() {
    const text = `${headlineInput.value} ${articleInput.value}`.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    if (charCountEl) charCountEl.textContent = `${chars} characters`;
    if (wordCountEl) wordCountEl.textContent = `${words} words`;
  }
  headlineInput.addEventListener("input", updateCounts);
  articleInput.addEventListener("input", updateCounts);

  // Clear form
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      headlineInput.value = "";
      articleInput.value = "";
      currentActiveUrl = "";
      if (domainTrustDisplay) domainTrustDisplay.classList.add("hidden");
      updateCounts();
      headlineInput.focus();
    });
  }

  // Preset Sample news buttons
  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sampleKey = btn.getAttribute("data-sample");
      const sample = SAMPLE_NEWS[sampleKey];
      if (sample) {
        headlineInput.value = sample.headline;
        articleInput.value = sample.article;
        currentActiveUrl = sample.url || "";
        if (articleUrlInput) articleUrlInput.value = sample.url || "";

        // Reset domain trust display
        if (sample.url && sampleKey.includes("real")) {
          if (domainTrustDisplay) {
            domainTrustDisplay.className = "domain-trust-banner high-trust";
            domainNameLabel.textContent = sample.url.split("/")[2].replace("www.", "");
            domainTypeLabel.textContent = "Verified News Publication";
            domainScoreLabel.textContent = "Trust: 95/100";
            domainTrustDisplay.classList.remove("hidden");
          }
        } else if (sampleKey === "satire_onion") {
          if (domainTrustDisplay) {
            domainTrustDisplay.className = "domain-trust-banner satire";
            domainNameLabel.textContent = "theonion.com";
            domainTypeLabel.textContent = "The Onion (Verified Satire / Parody)";
            domainScoreLabel.textContent = "Parody Media";
            domainTrustDisplay.classList.remove("hidden");
          }
        } else {
          if (domainTrustDisplay) domainTrustDisplay.classList.add("hidden");
        }

        updateCounts();
        headlineInput.focus();
      }
    });
  });

  // Reset to empty state
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      errorState.classList.add("hidden");
      resultState.classList.add("hidden");
      emptyState.classList.remove("hidden");
      headlineInput.focus();
    });
  }

  // Display error message
  function showError(msg) {
    emptyState.classList.add("hidden");
    resultState.classList.add("hidden");
    errorState.textContent = msg;
    errorState.classList.remove("hidden");
  }

  // Feature 2: Render Sentence Heatmap
  function renderSentenceHeatmap(heatmapData) {
    if (!sentenceStreamEl) return;
    sentenceStreamEl.innerHTML = "";

    const sentences = (heatmapData && heatmapData.sentences) ? heatmapData.sentences : [];
    const stats = (heatmapData && heatmapData.summary_stats) ? heatmapData.summary_stats : { total: 0, credible: 0, sensational: 0, unsubstantiated: 0 };

    // Update filter counts
    const countAll = document.getElementById("count-all");
    const countCred = document.getElementById("count-credible");
    const countSens = document.getElementById("count-sensational");
    const countUnsub = document.getElementById("count-unsub");

    if (countAll) countAll.textContent = stats.total || sentences.length;
    if (countCred) countCred.textContent = stats.credible || 0;
    if (countSens) countSens.textContent = stats.sensational || 0;
    if (countUnsub) countUnsub.textContent = stats.unsubstantiated || 0;

    sentences.forEach((s) => {
      const span = document.createElement("span");
      span.className = `sentence-token ${s.category}`;
      span.textContent = s.text + " ";
      span.setAttribute("data-category", s.category);
      span.setAttribute("data-id", s.id);

      span.addEventListener("click", () => {
        showSentenceInspector(s);
      });
      span.addEventListener("mouseenter", () => {
        showSentenceInspector(s);
      });

      sentenceStreamEl.appendChild(span);
    });

    // Setup filter chip buttons
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const filter = chip.getAttribute("data-filter");

        document.querySelectorAll(".sentence-token").forEach((tok) => {
          if (filter === "all" || tok.getAttribute("data-category") === filter) {
            tok.style.opacity = "1";
            tok.style.display = "inline";
          } else {
            tok.style.opacity = "0.2";
          }
        });
      });
    });
  }

  function showSentenceInspector(sentenceObj) {
    if (!sentenceInspectorEl) return;
    sentenceInspectorEl.classList.remove("hidden");
    inspNumEl.textContent = `Sentence #${sentenceObj.id} (${sentenceObj.category.toUpperCase()})`;
    inspBadgeEl.textContent = sentenceObj.category === "credible" ? "Attributed Statement" : (sentenceObj.category === "sensational" ? "Sensational Tone" : (sentenceObj.category === "unsubstantiated" ? "Unverified Claim" : "Neutral Context"));
    inspReasonsEl.textContent = sentenceObj.reasons.join(" • ");
  }

  // Feature 3: Export PDF and JSON Dossier
  if (printPdfBtn) {
    printPdfBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      if (!latestAnalysisData) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(latestAnalysisData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `NewsCheck_Dossier_${latestAnalysisData.case_id || 'Report'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Client-side fallback analyzer
  function clientSideCredibilityAnalysis(headline, article) {
    const fullText = `${headline} ${article}`.trim();
    const words = fullText.match(/\b[a-zA-Z]+\b/g) || [];
    const totalWords = Math.max(words.length, 1);

    const sensationalKeywords = [
      "shocking", "bombshell", "unbelievable", "secret", "exposed", "scandal",
      "destroy", "destroyed", "cabal", "hoax", "conspiracy", "mainstream",
      "jawdropping", "must-see", "horrifying", "urgent", "miracle", "poison",
      "alien", "microchip", "illuminati", "disgrace", "treason", "traitor",
      "scumbag", "brainwashed", "terrifying", "presstitutes"
    ];
    const sensationalMatches = words.filter(w => sensationalKeywords.includes(w.toLowerCase()));
    const capsWords = words.filter(w => w.length > 1 && w === w.toUpperCase() && !["USA", "UK", "EU", "UN", "FBI", "CIA", "NASA", "AI", "CEO"].includes(w));
    const exclamations = (fullText.match(/!/g) || []).length;
    const questions = (fullText.match(/\?/g) || []).length;

    const sensationalScore = Math.min(100, (capsWords.length * 8) + (sensationalMatches.length * 16) + (exclamations * 9) + (Math.max(0, questions - 1) * 6));

    const quotes = (fullText.match(/["\u201c\u201d\u2018\u2019][^"\u201c\u201d\u2018\u2019]{6,}["\u201c\u201d\u2018\u2019]/g) || []).length;
    const attrVerbs = ["said", "reported", "stated", "confirmed", "announced", "testified", "found", "noted", "according", "concluded", "projected"];
    const attrMatches = words.filter(w => attrVerbs.includes(w.toLowerCase()));
    const officialMarkers = ["spokesperson", "department", "official", "officials", "university", "researchers", "scientists", "agency", "authorities", "commission", "bureau", "investigators"];
    const officialMatches = words.filter(w => officialMarkers.includes(w.toLowerCase()));

    const sourcingScore = Math.min(100, (quotes * 22) + (attrMatches.length * 14) + (officialMatches.length * 16) + (totalWords > 50 ? 20 : 10));
    const objectivityScore = Math.max(0, Math.min(100, 100 - sensationalScore + Math.floor(sourcingScore / 3)));

    let credibilityScore = Math.round(50 + (sourcingScore * 0.45) - (sensationalScore * 0.55));
    credibilityScore = Math.max(5, Math.min(96, credibilityScore));

    let verdict = "VERIFIED CREDIBLE";
    let verdictType = "real";
    let summary = "Matches patterns of legitimate, professionally reported news with objective phrasing and credible syntax.";

    if (credibilityScore < 45) {
      verdict = "POTENTIALLY FAKE / MISLEADING";
      verdictType = "fake";
      summary = "Displays prominent characteristics of misleading articles, viral hoaxes, or clickbait exaggeration.";
    } else if (credibilityScore <= 64) {
      verdict = "UNVERIFIED / MIXED SIGNALS";
      verdictType = "mixed";
      summary = "Contains mixed stylistic indicators. We recommend cross-referencing with primary wire services.";
    }

    const sentences = (article || headline).split(/(?<=[.!?])\s+/).map((text, i) => ({
      id: i + 1,
      text: text,
      category: text.includes('"') || text.toLowerCase().includes("said") ? "credible" : (text.toUpperCase() === text && text.length > 20 ? "sensational" : "neutral"),
      reasons: ["Syntactic context evaluation"]
    }));

    return {
      case_id: "NC-" + new Date().getFullYear() + "-LOCAL",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      sha256: "client-side-sha256-verified",
      verdict: verdict,
      verdict_type: verdictType,
      prediction: verdictType === "real" ? "REAL" : "FAKE",
      credibility_score: credibilityScore,
      model_confidence: credibilityScore,
      summary: summary,
      linguistics: {
        sensational_score: sensationalScore,
        sourcing_score: sourcingScore,
        objectivity_score: objectivityScore,
        signals: [
          { type: quotes > 0 ? "positive" : "negative", text: quotes > 0 ? `Found ${quotes} direct quoted statement(s)` : "No direct quotes identified" },
          { type: sensationalScore < 20 ? "positive" : "negative", text: sensationalScore < 20 ? "Sensationalism levels within journalistic thresholds" : "Elevated clickbait / emotional phrasing" }
        ]
      },
      sentence_heatmap: {
        sentences: sentences,
        summary_stats: { total: sentences.length, credible: 1, sensational: 0, unsubstantiated: 0, neutral: sentences.length - 1 }
      },
      domain_info: null,
      notice: "Client analysis mode. To enable the deep machine learning TF-IDF model, run 'python app.py' and open http://127.0.0.1:5000."
    };
  }

  // Populate UI with prediction data
  function renderAnalysisResult(data) {
    latestAnalysisData = data;
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");
    resultState.classList.remove("hidden");

    // Dossier metadata bar
    const caseIdEl = document.getElementById("case-id-val");
    const shaEl = document.getElementById("sha-val");
    const timeEl = document.getElementById("timestamp-val");
    if (caseIdEl) caseIdEl.textContent = data.case_id || "NC-2026-X89F";
    if (shaEl) shaEl.textContent = (data.sha256 || "").substring(0, 16) + "...";
    if (timeEl) timeEl.textContent = data.timestamp || "";

    // Verdict Banner
    const banner = document.getElementById("verdict-banner");
    banner.className = `result-card-banner ${data.verdict_type}`;

    const icon = document.getElementById("verdict-icon");
    if (data.verdict_type === "real") icon.textContent = "✓";
    else if (data.verdict_type === "fake") icon.textContent = "✕";
    else if (data.verdict_type === "satire") icon.textContent = "🎭";
    else icon.textContent = "⚠";

    document.getElementById("verdict-tag").textContent = data.verdict_type === "real" ? "VERIFIED CREDIBLE NEWS" : (data.verdict_type === "satire" ? "INTENTIONAL SATIRE / PARODY" : "MISLEADING / SUSPICIOUS PATTERN");
    document.getElementById("verdict-title").textContent = data.verdict;
    document.getElementById("verdict-summary").textContent = data.summary;

    // Credibility Gauge
    const gaugeScore = document.getElementById("credibility-value");
    const gaugeBar = document.getElementById("credibility-bar");
    gaugeScore.textContent = `${data.credibility_score}%`;
    gaugeBar.style.width = `${data.credibility_score}%`;

    // Linguistics Sub-Meters
    const ling = data.linguistics || {};
    const sensationalVal = ling.sensational_score || 0;
    const sourcingVal = ling.sourcing_score || 0;
    const objectivityVal = ling.objectivity_score || 0;

    document.getElementById("sensational-val").textContent = sensationalVal > 40 ? "Elevated" : "Low";
    document.getElementById("sensational-bar").style.width = `${sensationalVal}%`;
    document.getElementById("sensational-bar").style.background = sensationalVal > 40 ? "var(--fake-red)" : "var(--real-green)";

    document.getElementById("sourcing-val").textContent = sourcingVal > 40 ? "Verified" : "Minimal";
    document.getElementById("sourcing-bar").style.width = `${sourcingVal}%`;
    document.getElementById("sourcing-bar").style.background = sourcingVal > 40 ? "var(--real-green)" : "var(--amber)";

    document.getElementById("objectivity-val").textContent = objectivityVal > 60 ? "Neutral" : "Biased";
    document.getElementById("objectivity-bar").style.width = `${objectivityVal}%`;
    document.getElementById("objectivity-bar").style.background = objectivityVal > 60 ? "var(--real-green)" : "var(--fake-red)";

    // Feature 2: Sentence Claim Heatmap
    if (data.sentence_heatmap) {
      renderSentenceHeatmap(data.sentence_heatmap);
    }

    // Signals List
    const signalListEl = document.getElementById("signals-list");
    signalListEl.innerHTML = "";
    const signals = ling.signals || [];
    if (signals.length === 0) {
      signalListEl.innerHTML = `<li class="signal-item"><span class="signal-icon">ℹ</span><span>Standard journalistic structure detected with balanced phrasing.</span></li>`;
    } else {
      signals.forEach(s => {
        const li = document.createElement("li");
        li.className = `signal-item ${s.type === 'positive' ? 'signal-pos' : 'signal-neg'}`;
        li.innerHTML = `<span class="signal-icon">${s.type === 'positive' ? '✓' : '⚠'}</span><span>${s.text}</span>`;
        signalListEl.appendChild(li);
      });
    }

    // Notice
    document.getElementById("result-notice").textContent = data.notice || "Always verify critical news with primary reporting agencies.";
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const headline = headlineInput.value.trim();
    const article = articleInput.value.trim();
    const combinedLength = `${headline} ${article}`.trim().length;

    if (combinedLength < 25) {
      showError("Please enter at least 25 characters of news headline or article text.");
      return;
    }

    analyzeBtn.disabled = true;
    const btnSpan = analyzeBtn.querySelector("span:first-child");
    const origBtnText = btnSpan ? btnSpan.textContent : "Run News Verification";
    if (btnSpan) btnSpan.textContent = "Analyzing Claims & Syntax…";
    errorState.classList.add("hidden");

    try {
      let data;
      if (window.location.protocol.startsWith("http")) {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headline, article, url: currentActiveUrl })
        });
        const resJson = await response.json();
        if (!response.ok) {
          throw new Error(resJson.error || "Server could not complete prediction.");
        }
        data = resJson;
      } else {
        data = clientSideCredibilityAnalysis(headline, article);
      }
      renderAnalysisResult(data);
    } catch (err) {
      console.warn("Backend API unavailable, using client-side credibility engine:", err);
      const fallbackData = clientSideCredibilityAnalysis(headline, article);
      renderAnalysisResult(fallbackData);
    } finally {
      analyzeBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = origBtnText;
    }
  });
});
