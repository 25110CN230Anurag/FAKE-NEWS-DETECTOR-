/**
 * Veritas Web Application Core Logic
 * Handles tab transitions, API communication, radial gauges, and UI animations.
 */

let activeTab = 'url';
let latestAnalysisResult = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSamples();
    setupEventListeners();
});

function setupEventListeners() {
    const textInput = document.getElementById('news-text-input');
    const charCounter = document.getElementById('char-counter');

    if (textInput && charCounter) {
        textInput.addEventListener('input', () => {
            const count = textInput.value.length;
            charCounter.textContent = `${count} characters`;
        });
    }

    // Enter key triggers analysis in URL mode
    const urlInput = document.getElementById('news-url-input');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startAnalysis();
            }
        });
    }
}

function switchTab(tab) {
    activeTab = tab;
    const urlSection = document.getElementById('url-input-section');
    const textSection = document.getElementById('text-input-section');
    const tabUrlBtn = document.getElementById('tab-url-btn');
    const tabTextBtn = document.getElementById('tab-text-btn');

    if (tab === 'url') {
        urlSection.classList.remove('hidden');
        textSection.classList.add('hidden');
        tabUrlBtn.className = 'tab-btn active flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30';
        tabTextBtn.className = 'tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-gray-400 hover:text-white hover:bg-gray-800/60';
    } else {
        urlSection.classList.add('hidden');
        textSection.classList.remove('hidden');
        tabTextBtn.className = 'tab-btn active flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30';
        tabUrlBtn.className = 'tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-gray-400 hover:text-white hover:bg-gray-800/60';
    }
}

function clearUrlInput() {
    document.getElementById('news-url-input').value = '';
}

function clearTextInput() {
    const input = document.getElementById('news-text-input');
    input.value = '';
    document.getElementById('char-counter').textContent = '0 characters';
}

async function loadSamples() {
    try {
        const response = await fetch('/api/samples');
        const data = await response.json();
        if (data.success && data.samples) {
            renderSampleCards(data.samples);
        }
    } catch (err) {
        console.warn('Could not load samples:', err);
    }
}

function renderSampleCards(samples) {
    const container = document.getElementById('samples-grid');
    if (!container) return;

    container.innerHTML = samples.map(sample => {
        const isReal = sample.type.toLowerCase().includes('genuine') || sample.type.toLowerCase().includes('economic');
        const badgeColor = isReal ? 'emerald' : 'rose';
        const iconName = isReal ? 'check-circle' : 'alert-circle';

        return `
            <div onclick="selectSample('${sample.id}')" 
                 class="group bg-gray-900/70 hover:bg-gray-900 border border-gray-800 hover:border-blue-500/50 p-4 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3">
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/20">
                            ${sample.type}
                        </span>
                        <span class="text-[11px] text-gray-500">${sample.publisher}</span>
                    </div>
                    <h4 class="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                        ${sample.title}
                    </h4>
                    <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        ${sample.text}
                    </p>
                </div>
                <div class="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-800/60">
                    <span>Expected: <strong class="text-gray-300 font-medium">${sample.expected}</strong></span>
                    <span class="text-blue-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Verify &rarr;
                    </span>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function showError(title, message) {
    const banner = document.getElementById('error-banner');
    if (!banner) {
        alert(`${title}: ${message}`);
        return;
    }
    document.getElementById('error-banner-title').textContent = title;
    document.getElementById('error-banner-desc').textContent = message;
    banner.classList.remove('hidden');
    lucide.createIcons();
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    const banner = document.getElementById('error-banner');
    if (banner) banner.classList.add('hidden');
}

let cachedSamples = [];
async function selectSample(sampleId) {
    try {
        hideError();
        const resp = await fetch('/api/samples');
        const data = await resp.json();
        const sample = data.samples.find(s => s.id === sampleId);
        if (!sample) return;

        // Switch to text tab and populate text so samples verify reliably without 404s
        switchTab('text');
        document.getElementById('news-text-input').value = sample.text;
        document.getElementById('char-counter').textContent = `${sample.text.length} characters`;

        // Auto trigger analysis
        startAnalysis();
    } catch (e) {
        console.error(e);
    }
}

async function startAnalysis() {
    hideError();
    let payload = {};
    if (activeTab === 'url') {
        const url = document.getElementById('news-url-input').value.trim();
        if (!url) {
            showError('Missing URL', 'Please enter a valid news URL (e.g. from NDTV or Times of India).');
            return;
        }
        payload = { url };
    } else {
        const text = document.getElementById('news-text-input').value.trim();
        if (!text) {
            showError('Missing Text', 'Please paste some news text or a headline to analyze.');
            return;
        }
        payload = { text };
    }

    // Toggle Loading State
    showLoading(true);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            showLoading(false);
            const err = data.error || 'Failed to analyze news.';
            if (err.includes('404')) {
                showError('Webpage Not Found (404 Error)', 'The publisher website returned 404 Not Found for this URL. Please verify the URL link, or copy the article text and paste it into the "Paste Raw Text" tab!');
            } else {
                showError('Analysis Failed', err + ' (Tip: You can copy and paste the article text directly into the "Paste Raw Text" tab).');
            }
            return;
        }

        latestAnalysisResult = data;
        renderResults(data);
        showLoading(false);

        // Smooth scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error(error);
        showLoading(false);
        showError('Server Error', 'Server communication error. Please check if Python server is running.');
    }
}

function showLoading(isLoading) {
    const loader = document.getElementById('loading-state');
    const results = document.getElementById('results-section');
    const btn = document.getElementById('analyze-btn');

    if (isLoading) {
        loader.classList.remove('hidden');
        results.classList.add('hidden');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        // Step simulation
        const title = document.getElementById('loading-step-title');
        const desc = document.getElementById('loading-step-desc');
        const fill = document.getElementById('progress-bar-fill');

        fill.style.width = '30%';
        title.textContent = 'Parsing Content & Decomposing Claims...';
        desc.textContent = 'Extracting declarative statements and isolating assertions.';

        setTimeout(() => {
            fill.style.width = '65%';
            title.textContent = 'Running ML Classifier & Stylometrics...';
            desc.textContent = 'Evaluating linguistic sensationalism and cross-referencing news wires.';
        }, 800);

        setTimeout(() => {
            fill.style.width = '90%';
            title.textContent = 'Synthesizing Veracity Percentage...';
            desc.textContent = 'Aggregating claim ratios, domain authority, and debunk checks.';
        }, 1600);

    } else {
        loader.classList.add('hidden');
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function renderResults(data) {
    const results = document.getElementById('results-section');
    results.classList.remove('hidden');

    const veracity = data.veracity_percentage || 0;
    const badgeColor = data.verdict_badge || 'emerald';

    // 1. Veracity Gauge & Number Animation
    animateGauge(veracity, badgeColor);

    // 2. Verdict Banner & Narrative
    const verdictBadge = document.getElementById('verdict-badge');
    verdictBadge.textContent = data.verdict || 'ANALYZED';
    verdictBadge.className = `px-3 py-1 rounded-lg text-sm font-extrabold tracking-wide uppercase bg-${badgeColor}-500/20 text-${badgeColor}-400 border border-${badgeColor}-500/30`;

    const tierPill = document.getElementById('veracity-tier-pill');
    tierPill.textContent = data.verdict;
    tierPill.className = `mt-3 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/30`;

    document.getElementById('article-title-display').textContent = data.article.title || 'Evaluated Article Content';
    document.getElementById('verdict-narrative').textContent = data.verdict_description || '';
    document.getElementById('source-badge').textContent = data.article.domain_info?.publisher_name || data.article.domain || 'Direct Text Input';

    // Glow background color
    const glow = document.getElementById('verdict-bg-glow');
    glow.className = `absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 bg-${badgeColor}-500`;

    // 3. Metadata Bar
    document.getElementById('meta-publisher').textContent = data.article.domain || 'Direct Input';
    document.getElementById('meta-trust').textContent = `${data.metrics.publisher_trust_score} / 100 Trust`;
    document.getElementById('meta-trust').className = `font-semibold text-${badgeColor}-400 block`;
    document.getElementById('meta-author').textContent = data.article.author || 'Editorial';

    const counts = data.claim_counts || {};
    document.getElementById('meta-claims-ratio').textContent = `${counts.true_claims || 0} / ${counts.total || 0} Verified`;

    // 4. Metrics Grid
    setMetricValue('metric-ml-score', 'metric-ml-bar', data.metrics.ml_authenticity_score, 'bg-blue-500');
    setMetricValue('metric-claims-score', 'metric-claims-bar', data.metrics.claims_truth_ratio, 'bg-emerald-500');
    setMetricValue('metric-corroboration-score', 'metric-corroboration-bar', data.metrics.live_corroboration_score, 'bg-indigo-500');
    setMetricValue('metric-sensationalism-score', 'metric-sensationalism-bar', data.metrics.sensationalism_index, 'bg-amber-500');

    // 5. Claims Breakdown Container
    renderClaimsList(data.claims || []);

    // 6. Corroborating News Wires
    renderSourcesList(data.corroboration_sources || []);

    // 7. Stylometrics & Forensics
    document.getElementById('forensic-tone').textContent = data.metrics.emotional_tone || 'Standard';
    document.getElementById('forensic-formality').textContent = `${data.metrics.journalistic_formality || 50}%`;

    const kwContainer = document.getElementById('flagged-keywords-container');
    const flagged = data.metrics.flagged_keywords || [];
    if (flagged.length > 0) {
        kwContainer.innerHTML = flagged.map(k => `
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                "${k}"
            </span>
        `).join('');
    } else {
        kwContainer.innerHTML = `<span class="text-xs text-gray-500 italic">No sensationalist buzzwords detected (High journalistic formality)</span>`;
    }

    lucide.createIcons();
}

function animateGauge(targetPercentage, color) {
    const circle = document.getElementById('gauge-circle');
    const number = document.getElementById('veracity-number');

    const circumference = 264; // 2 * pi * r (r=42)
    const offset = circumference - (targetPercentage / 100) * circumference;

    // Reset and apply
    circle.style.strokeDashoffset = offset;
    circle.className = `transition-all duration-1000 ease-out text-${color}-500`;

    // Count up animation
    let current = 0;
    const duration = 1000;
    const stepTime = 20;
    const increment = targetPercentage / (duration / stepTime);

    const timer = setInterval(() => {
        current += increment;
        if (current >= targetPercentage) {
            current = targetPercentage;
            clearInterval(timer);
        }
        number.textContent = `${Math.round(current)}%`;
    }, stepTime);
}

function setMetricValue(scoreId, barId, value, bgClass) {
    const val = Math.round(value || 0);
    document.getElementById(scoreId).textContent = `${val}%`;
    const bar = document.getElementById(barId);
    bar.style.width = `${val}%`;
    bar.className = `h-full rounded-full ${bgClass}`;
}

function renderClaimsList(claims) {
    const container = document.getElementById('claims-container');
    const countBadge = document.getElementById('claims-count-badge');
    countBadge.textContent = `${claims.length} claims extracted & evaluated`;

    if (!claims.length) {
        container.innerHTML = `<div class="p-4 bg-gray-900 rounded-xl text-gray-500 text-xs">No explicit claims found.</div>`;
        return;
    }

    container.innerHTML = claims.map((c, i) => {
        const badgeColor = c.badge_color || 'emerald';
        const iconName = badgeColor === 'emerald' ? 'check-circle-2' : (badgeColor === 'rose' ? 'x-circle' : 'alert-triangle');

        return `
            <div class="bg-gray-900/90 border border-gray-800/90 hover:border-gray-700 p-4 rounded-xl space-y-2 transition-all">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-2.5">
                        <span class="w-5 h-5 rounded-md bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                            #${i + 1}
                        </span>
                        <p class="text-xs sm:text-sm font-medium text-gray-200 leading-snug">
                            "${c.claim}"
                        </p>
                    </div>
                    <div class="shrink-0 text-right">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/30">
                            <i data-lucide="${iconName}" class="w-3 h-3"></i>
                            ${c.status}
                        </span>
                        <span class="block text-[11px] font-mono text-gray-400 mt-1">${c.truth_score}% Truth</span>
                    </div>
                </div>

                <div class="pl-7 pt-1 flex items-start gap-2 text-xs text-gray-400 bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/40">
                    <i data-lucide="info" class="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5"></i>
                    <div>
                        <span class="text-gray-300 font-medium">Evidence & Forensics: </span>
                        <span>${c.reason}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSourcesList(sources) {
    const container = document.getElementById('sources-container');
    if (!sources || !sources.length) {
        container.innerHTML = `
            <div class="p-3 bg-gray-900/50 rounded-lg text-gray-500 text-xs italic">
                No contemporaneous wire articles detected. Verification based on stylometrics & domain registry.
            </div>
        `;
        return;
    }

    container.innerHTML = sources.map(s => {
        const isDebunk = s.is_debunk;
        const iconColor = isDebunk ? 'text-rose-400' : 'text-blue-400';
        return `
            <a href="${s.link}" target="_blank" rel="noopener noreferrer" 
               class="group block p-3 rounded-lg bg-gray-900/80 hover:bg-gray-800/90 border border-gray-800/80 hover:border-gray-700 transition-all">
                <div class="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span class="font-semibold text-gray-300">${s.source}</span>
                    <span class="text-[10px]">${s.date || 'Recent'}</span>
                </div>
                <h5 class="text-xs font-medium text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2">
                    ${s.title}
                </h5>
                ${isDebunk ? '<span class="inline-block mt-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Fact-Check / Debunk</span>' : ''}
            </a>
        `;
    }).join('');
}

function copyReportSummary() {
    if (!latestAnalysisResult) return;
    const r = latestAnalysisResult;
    const text = `VERITAS FACT-CHECK REPORT\n` +
                 `Title: ${r.article.title}\n` +
                 `Veracity Score: ${r.veracity_percentage}% (${r.verdict})\n` +
                 `Publisher: ${r.article.domain} (${r.metrics.publisher_trust_score}/100 Trust)\n` +
                 `Summary: ${r.verdict_description}\n` +
                 `Total Claims Evaluated: ${r.claim_counts.total} (${r.claim_counts.true_claims} Verified True)\n` +
                 `Generated by Veritas AI Fact-Checking Engine`;

    navigator.clipboard.writeText(text).then(() => {
        alert('Verification summary copied to clipboard!');
    }).catch(() => {
        alert('Could not access clipboard.');
    });
}
