import dns from 'dns/promises';
import { URL } from 'url';

/**
 * Validates URLs against Server-Side Request Forgery (SSRF) and DNS rebinding.
 * Blocks private, loopback, link-local, multicast, and non-routable IP ranges.
 */

// IPv4 private & restricted ranges
const RESTRICTED_IPV4_RANGES = [
  { start: '0.0.0.0', end: '0.255.255.255', desc: 'Current network' },
  { start: '10.0.0.0', end: '10.255.255.255', desc: 'Private 10.0.0.0/8' },
  { start: '127.0.0.0', end: '127.255.255.255', desc: 'Loopback 127.0.0.0/8' },
  { start: '169.254.0.0', end: '169.254.255.255', desc: 'Link-local 169.254.0.0/16' },
  { start: '172.16.0.0', end: '172.31.255.255', desc: 'Private 172.16.0.0/12' },
  { start: '192.0.0.0', end: '192.0.0.255', desc: 'IETF Protocol Assignments' },
  { start: '192.168.0.0', end: '192.168.255.255', desc: 'Private 192.168.0.0/16' },
  { start: '198.18.0.0', end: '198.19.255.255', desc: 'Benchmarking' },
  { start: '224.0.0.0', end: '239.255.255.255', desc: 'Multicast' },
  { start: '240.0.0.0', end: '255.255.255.255', desc: 'Reserved' }
];

function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isRestrictedIpv4(ip) {
  const ipLong = ipToLong(ip);
  for (const range of RESTRICTED_IPV4_RANGES) {
    const start = ipToLong(range.start);
    const end = ipToLong(range.end);
    if (ipLong >= start && ipLong <= end) {
      return { restricted: true, reason: range.desc };
    }
  }
  return { restricted: false };
}

function isRestrictedIpv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return { restricted: true, reason: 'IPv6 loopback' };
  }
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') {
    return { restricted: true, reason: 'IPv6 unspecified' };
  }
  if (normalized.startsWith('fe80:') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return { restricted: true, reason: 'IPv6 link-local' };
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return { restricted: true, reason: 'IPv6 unique local (ULA)' };
  }
  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v4Part)) {
      return isRestrictedIpv4(v4Part);
    }
  }
  return { restricted: false };
}

/**
 * Validates a target URL before fetching.
 * Returns { safe: boolean, url: URL, ip: string, error?: string }
 */
export async function validateUrlForSsrf(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { safe: false, error: 'A valid URL string is required.' };
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { safe: false, error: 'Malformed URL. Please include http:// or https://' };
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Protocol "${parsed.protocol}" is not allowed. Use http:// or https:// only.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject internal hostnames and aliases
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.corp')
  ) {
    return { safe: false, error: 'Access to internal network hostnames is blocked for security.' };
  }

  // 3. Reject direct raw IP representations that are private
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    const v4Check = isRestrictedIpv4(hostname);
    if (v4Check.restricted) {
      return { safe: false, error: `Access to private IP (${v4Check.reason}) is forbidden.` };
    }
  }

  // 4. Resolve DNS to verify real underlying IP addresses (prevent DNS rebinding / internal routing)
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, error: `Could not resolve hostname "${hostname}". Check domain spelling.` };
    }

    for (const record of records) {
      const { address, family } = record;
      if (family === 4) {
        const v4Check = isRestrictedIpv4(address);
        if (v4Check.restricted) {
          return { safe: false, error: `Domain resolves to private IP (${address} - ${v4Check.reason}). Request blocked.` };
        }
      } else if (family === 6) {
        const v6Check = isRestrictedIpv6(address);
        if (v6Check.restricted) {
          return { safe: false, error: `Domain resolves to restricted IPv6 (${address} - ${v6Check.reason}). Request blocked.` };
        }
      }
    }

    return {
      safe: true,
      url: parsed,
      resolvedIp: records[0].address
    };
  } catch (err) {
    return { safe: false, error: `DNS lookup failed for "${hostname}": ${err.message}` };
  }
}
