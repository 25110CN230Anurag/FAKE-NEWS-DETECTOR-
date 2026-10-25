import assert from 'assert';
import { validateUrlForSsrf } from '../src/services/ssrfValidator.js';
import { normalizeRating } from '../src/services/googleFactCheck.js';
import { extractKeywords, fetchLiveHeadlines } from '../src/services/newsApi.js';
import { synthesizeRuleBasedVerdict } from '../src/services/geminiAnalyzer.js';

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n--- TruthLens AI Backend Test Suite ---\n');

  console.log('1. SSRF Defense & URL Validation Tests:');

  const localhostCheck = await validateUrlForSsrf('http://localhost:3000/api');
  it('Should block localhost', () => {
    assert.strictEqual(localhostCheck.safe, false);
  });

  const loopbackIpCheck = await validateUrlForSsrf('http://127.0.0.1:8080/secret');
  it('Should block 127.0.0.1 loopback', () => {
    assert.strictEqual(loopbackIpCheck.safe, false);
  });

  const awsMetadataCheck = await validateUrlForSsrf('http://169.254.169.254/latest/meta-data/');
  it('Should block AWS cloud metadata link-local IP 169.254.169.254', () => {
    assert.strictEqual(awsMetadataCheck.safe, false);
  });

  const privateSubnetCheck = await validateUrlForSsrf('http://192.168.1.1/router');
  it('Should block private RFC1918 subnet 192.168.x.x', () => {
    assert.strictEqual(privateSubnetCheck.safe, false);
  });

  const badProtocolCheck = await validateUrlForSsrf('ftp://example.com/file.txt');
  it('Should reject non-HTTP protocols (e.g. ftp://)', () => {
    assert.strictEqual(badProtocolCheck.safe, false);
  });

  const publicUrlCheck = await validateUrlForSsrf('https://en.wikipedia.org/wiki/Main_Page');
  it('Should allow safe public URL (wikipedia.org)', () => {
    assert.strictEqual(publicUrlCheck.safe, true);
  });

  console.log('\n2. Fact-Checker Rating Normalizer Tests:');

  it('Normalizes "False" and "Pants on Fire" to Likely False', () => {
    assert.strictEqual(normalizeRating('Pants on Fire').standardVerdict, 'Likely False');
    assert.strictEqual(normalizeRating('False').standardVerdict, 'Likely False');
    assert.strictEqual(normalizeRating('Debunked: Fabricated statement').standardVerdict, 'Likely False');
  });

  it('Normalizes "True" and "Correct" to Likely True', () => {
    assert.strictEqual(normalizeRating('True').standardVerdict, 'Likely True');
    assert.strictEqual(normalizeRating('Correct').standardVerdict, 'Likely True');
  });

  it('Normalizes "Mostly False" and "Misleading" to Misleading / Partly True', () => {
    assert.strictEqual(normalizeRating('Mostly False').standardVerdict, 'Misleading / Partly True');
    assert.strictEqual(normalizeRating('Missing Context').standardVerdict, 'Misleading / Partly True');
  });

  it('Normalizes unrated/unknown to Unverified', () => {
    assert.strictEqual(normalizeRating('Unproven').standardVerdict, 'Unverified');
    assert.strictEqual(normalizeRating('').standardVerdict, 'Unverified');
  });

  console.log('\n3. Keyword Extraction Tests:');

  it('Strips stopwords and extracts primary entities', () => {
    const kw = extractKeywords('Did the government announce a new national education policy today?');
    assert.ok(kw.includes('government'));
    assert.ok(kw.includes('national'));
    assert.ok(kw.includes('education'));
    assert.ok(!kw.includes('the'));
    assert.ok(!kw.includes('did'));
  });

  console.log('\n4. Grounding & Evidence Engine Consensus Tests:');

  it('Forces verdict to Likely False when authoritative debunk exists', () => {
    const result = synthesizeRuleBasedVerdict({
      headline: 'Viral claim that drinking bleach cures viruses',
      content: 'A post circulating on social media claims drinking bleach cures viruses.',
      factChecks: {
        claims: [
          {
            standardVerdict: 'Likely False',
            publisher: 'Snopes',
            reviewTitle: 'Drinking bleach does not cure viruses',
            reviewUrl: 'https://snopes.com/fact-check/bleach',
            textualRating: 'False'
          }
        ]
      },
      relatedNews: { articles: [] }
    });

    assert.strictEqual(result.verdict, 'Likely False');
    assert.ok(result.confidenceScore >= 75);
    assert.ok(result.contradictingEvidence.length > 0);
  });

  it('Assigns "Unverified" when no fact checks and no news coverage exist (anti-hallucination)', () => {
    const result = synthesizeRuleBasedVerdict({
      headline: 'Some obscure local statement that no one ever reported',
      content: 'A random sentence with no web presence.',
      factChecks: { claims: [] },
      relatedNews: { articles: [] }
    });

    assert.strictEqual(result.verdict, 'Unverified');
    assert.ok(result.summaryVerdict.includes('No matching fact-checks') || result.summaryVerdict.includes('evidence'));
  });

  console.log('\n5. Live News Feed Tests:');
  const liveFeed = await fetchLiveHeadlines('technology');
  it('Live news service successfully retrieves real-time headlines', () => {
    assert.strictEqual(liveFeed.success, true);
    assert.ok(Array.isArray(liveFeed.articles));
    assert.ok(liveFeed.articles.length > 0);
    console.log(`     Retrieved ${liveFeed.articles.length} live headlines via ${liveFeed.provider}`);
  });

  console.log(`\n================================`);
  console.log(`Tests Completed: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
