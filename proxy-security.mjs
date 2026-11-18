import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';

/**
 * Use Railway's sanitized X-Real-IP only when the app is running behind
 * Railway's public HTTP edge. On other hosts, trust only the socket peer.
 */
export function getClientAddress(req, railwayEnvironment = Boolean(process.env.RAILWAY_ENVIRONMENT)) {
  const forwarded = railwayEnvironment ? req.headers['x-real-ip'] : null;
  return typeof forwarded === 'string' && isIP(forwarded.trim())
    ? forwarded.trim()
    : (req.socket.remoteAddress || 'unknown');
}

/**
 * Normalize IPv4-mapped IPv6 answers before Wisp applies its private-IP
 * filter. ipaddr.js otherwise classifies these as ipv4Mapped, not loopback
 * or private, even when the embedded IPv4 address is 127.0.0.1/10.x/etc.
 */
export function normalizeResolvedAddress(address) {
  if (isIP(address) !== 6) return address;
  const parsed = ipaddr.parse(address);
  return parsed.kind() === 'ipv6' && parsed.isIPv4MappedAddress()
    ? parsed.toIPv4Address().toString()
    : address;
}
