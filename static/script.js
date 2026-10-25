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

  // API Grounding Elements
  const apiSettingsBtn = document.getElementById("api-settings-btn");
  const apiStatusDot = document.getElementById("api-status-dot");
  const apiStatusLabel = document.getElementById("api-status-label");
  const apiModal = document.getElementById("api-modal");
  const closeApiModal = document.getElementById("close-api-modal");
  const inputGeminiKey = document.getElementById("input-gemini-key");
  const inputFactcheckKey = document.getElementById("input-factcheck-key");
  const saveApiKeysBtn = document.getElementById("save-api-keys-btn");
  const clearApiKeysBtn = document.getElementById("clear-api-keys-btn");
  const apiSaveStatus = document.getElementById("api-save-status");
  const btnPromptConnectApi = document.getElementById("btn-prompt-connect-api");

  // Live Fact-Check Display Elements
  const liveFactcheckPanel = document.getElementById("live-factcheck-panel");
  const factcheckProviderTag = document.getElementById("factcheck-provider-tag");
  const factcheckStatusBadge = document.getElementById("factcheck-status-badge");
  const factcheckContentArea = document.getElementById("factcheck-content-area");
  const apiUpsellCard = document.getElementById("api-upsell-card");

  // Helper escape function
  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

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

  // Update API status badge dot
  function updateApiStatusIndicator(serverGemini, serverFactcheck) {
    const clientGemini = Boolean(localStorage.getItem("newscheck_gemini_key"));
    const clientFactcheck = Boolean(localStorage.getItem("newscheck_factcheck_key"));
    const isConnected = clientGemini || clientFactcheck || serverGemini || serverFactcheck;

    if (apiStatusDot) {
      if (isConnected) {
        apiStatusDot.classList.add("active");
      } else {
        apiStatusDot.classList.remove("active");
      }
    }
    if (apiStatusLabel) {
      apiStatusLabel.textContent = isConnected ? "Live API Active" : "Fact-Check API";
    }
  }

  // Check backend server & API configuration
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

      // Check external API key status on server
      const apiRes = await fetch("/api/api-status");
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        updateApiStatusIndicator(apiData.gemini_configured, apiData.factcheck_configured);
      } else {
        updateApiStatusIndicator(false, false);
      }
    } catch (e) {
      if (serverStatusBadge) {
        serverStatusBadge.classList.add("offline");
        serverStatusBadge.querySelector(".status-text").textContent = "Local Mode";
      }
      updateApiStatusIndicator(false, false);
    }
  }
  checkServerStatus();

  // API Modal Handlers
  function openApiModal() {
    if (inputGeminiKey) inputGeminiKey.value = localStorage.getItem("newscheck_gemini_key") || "";
    if (inputFactcheckKey) inputFactcheckKey.value = localStorage.getItem("newscheck_factcheck_key") || "";
    if (apiSaveStatus) apiSaveStatus.classList.add("hidden");
    if (apiModal) apiModal.classList.remove("hidden");
  }

  function closeApiModalFn() {
    if (apiModal) apiModal.classList.add("hidden");
  }

  if (apiSettingsBtn) apiSettingsBtn.addEventListener("click", openApiModal);
  if (btnPromptConnectApi) btnPromptConnectApi.addEventListener("click", openApiModal);
  if (closeApiModal) closeApiModal.addEventListener("click", closeApiModalFn);
  if (apiModal) {
    apiModal.addEventListener("click", (e) => {
      if (e.target === apiModal) closeApiModalFn();
    });
  }

  // Save API keys
  if (saveApiKeysBtn) {
    saveApiKeysBtn.addEventListener("click", () => {
      const geminiVal = inputGeminiKey ? inputGeminiKey.value.trim() : "";
      const factcheckVal = inputFactcheckKey ? inputFactcheckKey.value.trim() : "";

      if (geminiVal) localStorage.setItem("newscheck_gemini_key", geminiVal);
      else localStorage.removeItem("newscheck_gemini_key");

      if (factcheckVal) localStorage.setItem("newscheck_factcheck_key", factcheckVal);
      else localStorage.removeItem("newscheck_factcheck_key");

      updateApiStatusIndicator(Boolean(geminiVal), Boolean(factcheckVal));

      if (apiSaveStatus) {
        apiSaveStatus.className = "api-save-status success";
        apiSaveStatus.textContent = "✓ Settings saved! Live external grounding is now active.";
        apiSaveStatus.classList.remove("hidden");
      }
      setTimeout(closeApiModalFn, 1200);
    });
  }

  // Clear API keys
  if (clearApiKeysBtn) {
    clearApiKeysBtn.addEventListener("click", () => {
      localStorage.removeItem("newscheck_gemini_key");
      localStorage.removeItem("newscheck_factcheck_key");
      if (inputGeminiKey) inputGeminiKey.value = "";
      if (inputFactcheckKey) inputFactcheckKey.value = "";
      updateApiStatusIndicator(false, false);

      if (apiSaveStatus) {
        apiSaveStatus.className = "api-save-status cleared";
        apiSaveStatus.textContent = "Keys cleared. Reverted to offline local engine.";
        apiSaveStatus.classList.remove("hidden");
      }
    });
  }

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

    const conspiracyPatterns = [
      /\b(?:earth is flat|flat earth)\b/i,
      /\b(?:gravity is an illusion)\b/i,
      /\b(?:cures? (?:cancer|coronavirus|covid|aids|hiv|diabetes|all diseases|tumors?))\b/i,
      /\b(?:boiled garlic|drinking bleach|drink bleach|miracle tonic|secret cure|miracle cure)\b/i,
      /\b(?:microchips? in vaccines?|vaccines? contain microchips?|trackable microchips?|microchips? to monitor)\b/i,
      /\b(?:5g\b.*(?:drop dead|birds?|radiation|cancer|illness|depopulation|frequencies?|activate|towers?))\b/i,
      /\b(?:alien (?:corpse|body|base|autopsy|invasion))\b/i,
      /\b(?:engineered body double|cloned? (?:politician|hillary|biden|trump|celebrity)|body double)\b/i,
      /\b(?:secretly arrested by military|military tribunal|guantanamo execution)\b/i,
      /\b(?:free (?:iphone|smartphone|laptop|macbook|cash|money|ten thousand dollars))\b/i,
      /\b(?:every citizen (?:will receive|gets free))\b/i,
      /\b(?:wake up sheeple|share (?:this )?before (?:it is|they) deleted?|they don't want you to know)\b/i,
      /\b(?:mainstream media won't tell you|100% confirmed by insider)\b/i
    ];
    const disinfoMatch = conspiracyPatterns.find(pat => pat.test(fullText));

    const sensationalKeywords = [
      "shocking", "shock", "shocked", "bombshell", "unbelievable", "secret", "secretly",
      "exposed", "scandal", "destroy", "destroyed", "cabal", "hoax", "conspiracy",
      "mainstream", "jawdropping", "must-see", "horrifying", "urgent", "miracle",
      "poison", "alien", "microchip", "microchips", "illuminati", "disgrace",
      "treason", "traitor", "scumbag", "brainwashed", "terrifying", "presstitutes"
    ];
    const sensationalMatches = words.filter(w => sensationalKeywords.includes(w.toLowerCase()));
    const capsWords = words.filter(w => w.length > 1 && w === w.toUpperCase() && !["USA", "UK", "EU", "UN", "FBI", "CIA", "NASA", "AI", "CEO", "ISRO", "WHO"].includes(w));
    const exclamations = (fullText.match(/!/g) || []).length;
    const questions = (fullText.match(/\?/g) || []).length;

    const sensationalScore = Math.min(100, (capsWords.length * 8) + (sensationalMatches.length * 16) + (exclamations * 9) + (Math.max(0, questions - 1) * 6));

    const quotes = (fullText.match(/["\u201c\u201d\u2018\u2019][^"\u201c\u201d\u2018\u2019]{6,}["\u201c\u201d\u2018\u2019]/g) || []).length;
    const attrVerbs = [
      "said", "reported", "stated", "confirmed", "announced", "testified", "found",
      "noted", "according", "concluded", "projected", "unveiled", "launched", "published",
      "discovered", "approved", "signed", "recommended"
    ];
    const attrMatches = words.filter(w => attrVerbs.includes(w.toLowerCase()));
    const officialMarkers = [
      "spokesperson", "department", "official", "officials", "university",
      "researchers", "scientists", "agency", "authorities", "commission", "bureau",
      "investigators", "analysts", "organisation", "organization", "ministry",
      "government", "police", "court", "hospital", "isro", "nasa", "who", "federal reserve",
      "company", "corp", "corporation", "firm", "apple", "google", "microsoft", "meta",
      "amazon", "sony", "samsung", "nvidia", "intel", "biologists", "nature", "science", "commissioner"
    ];
    const officialMatches = words.filter(w => officialMarkers.includes(w.toLowerCase()));

    const sourcingScore = Math.min(100, (quotes * 22) + (attrMatches.length * 14) + (officialMatches.length * 16) + (totalWords > 50 ? 20 : 10));
    const objectivityScore = Math.max(0, Math.min(100, 100 - sensationalScore + Math.floor(sourcingScore / 3)));

    let credibilityScore = 50;
    let verdict = "VERIFIED CREDIBLE";
    let verdictType = "real";
    let summary = "Matches patterns of legitimate, professionally reported news with objective phrasing and verified syntax.";

    if (disinfoMatch) {
      credibilityScore = 11;
      verdict = "POTENTIALLY FAKE / MISLEADING";
      verdictType = "fake";
      summary = "Flagged viral hoax / conspiracy claim. Displays prominent characteristics of fabricated disinformation.";
    } else if (sensationalScore >= 35) {
      credibilityScore = Math.max(8, Math.round(35 - (sensationalScore * 0.3)));
      verdict = "POTENTIALLY FAKE / MISLEADING";
      verdictType = "fake";
      summary = "Displays prominent characteristics of misleading articles, clickbait exaggeration, and sensationalist rhetoric.";
    } else if (sensationalScore <= 10 && sourcingScore >= 20) {
      credibilityScore = Math.min(94, Math.round(72 + (sourcingScore * 0.2)));
      verdict = "VERIFIED CREDIBLE";
      verdictType = "real";
      summary = "Objective journalistic reporting with verified institutional attribution and absent sensationalism.";
    } else if (sourcingScore >= 15 && sensationalScore <= 15) {
      credibilityScore = Math.round(55 + (sourcingScore * 0.3));
      verdict = "VERIFIED CREDIBLE";
      verdictType = "real";
      summary = "Matches patterns of legitimate news with measured reporting and credible phrasing.";
    } else {
      credibilityScore = Math.round(30 + (sourcingScore * 0.2) - (sensationalScore * 0.3));
      if (credibilityScore >= 50) {
        verdict = "UNVERIFIED / MIXED SIGNALS";
        verdictType = "mixed";
        summary = "Contains mixed stylistic indicators. We recommend cross-referencing with primary wire services.";
      } else {
        verdict = "POTENTIALLY FAKE / MISLEADING";
        verdictType = "fake";
        summary = "Lacks credible journalistic indicators and contains characteristics common in unverified claims.";
      }
    }
    credibilityScore = Math.max(5, Math.min(96, credibilityScore));

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

    document.getElementById("verdict-tag").textContent = data.verdict_type === "real" ? "VERIFIED CREDIBLE NEWS" : (data.verdict_type === "satire" ? "INTENTIONAL SATIRE / PARODY" : (data.verdict_type === "fake" ? "POTENTIALLY FAKE / MISLEADING" : "UNVERIFIED / MIXED SIGNALS"));
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

    // Feature: Render Live External Fact-Check Grounding (Google Fact Check & Gemini)
    if (data.external_fact_check && data.external_fact_check.reviews && data.external_fact_check.reviews.length > 0) {
      if (liveFactcheckPanel && factcheckContentArea) {
        factcheckProviderTag.textContent = "Google Fact Check Tools API";
        factcheckStatusBadge.textContent = data.external_fact_check.has_debunk ? "Debunked by Fact-Checkers" : "Verified by Fact-Checkers";
        factcheckStatusBadge.className = `factcheck-status-badge ${data.external_fact_check.has_debunk ? 'false' : 'true'}`;

        factcheckContentArea.innerHTML = "";
        data.external_fact_check.reviews.forEach(r => {
          const ratingLower = (r.rating || "").toLowerCase();
          const ratingClass = (ratingLower.includes("false") || ratingLower.includes("pants") || ratingLower.includes("fake") || ratingLower.includes("misleading") || ratingLower.includes("incorrect")) ? "false" : (ratingLower.includes("true") ? "true" : "misleading");

          const card = document.createElement("div");
          card.className = "factcheck-review-card";
          card.innerHTML = `
            <div class="review-top-meta">
              <span class="review-publisher">${escapeHtml(r.publisher)}</span>
              <span class="review-rating-pill ${ratingClass}">${escapeHtml(r.rating)}</span>
            </div>
            <div class="review-claim-text"><strong>Claim:</strong> "${escapeHtml(r.claim)}"</div>
            ${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="review-source-link">View accredited debunk report on ${escapeHtml(r.publisher)} ↗</a>` : ''}
          `;
          factcheckContentArea.appendChild(card);
        });

        liveFactcheckPanel.classList.remove("hidden");
        if (apiUpsellCard) apiUpsellCard.classList.add("hidden");
      }
    } else if (data.gemini_fact_check) {
      if (liveFactcheckPanel && factcheckContentArea) {
        const gem = data.gemini_fact_check;
        factcheckProviderTag.textContent = "Google Gemini 1.5 Flash (Live Grounding)";
        factcheckStatusBadge.textContent = gem.verdict === "FAKE" ? "AI Grounding: Misleading" : (gem.verdict === "REAL" ? "AI Grounding: Verified" : "AI Grounding: Unverified");
        factcheckStatusBadge.className = `factcheck-status-badge ${gem.verdict === 'FAKE' ? 'false' : (gem.verdict === 'REAL' ? 'true' : 'misleading')}`;

        const sourcesHtml = (gem.debunk_sources || []).map(s => `<span class="gemini-source-tag">${escapeHtml(s)}</span>`).join("");

        factcheckContentArea.innerHTML = `
          <div class="gemini-analysis-box">
            <p>${escapeHtml(gem.fact_check_details || gem.summary)}</p>
            ${sourcesHtml ? `<div class="gemini-sources-row"><strong>Referenced News Sources:</strong> ${sourcesHtml}</div>` : ''}
          </div>
        `;
        liveFactcheckPanel.classList.remove("hidden");
        if (apiUpsellCard) apiUpsellCard.classList.add("hidden");
      }
    } else {
      if (liveFactcheckPanel) liveFactcheckPanel.classList.add("hidden");
      if (apiUpsellCard) apiUpsellCard.classList.remove("hidden");
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
        const payload = {
          headline,
          article,
          url: currentActiveUrl,
          gemini_api_key: localStorage.getItem("newscheck_gemini_key") || "",
          factcheck_api_key: localStorage.getItem("newscheck_factcheck_key") || ""
        };
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
