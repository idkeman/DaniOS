import http from 'node:http';
import { lookup } from 'node:dns/promises';
import { getClientAddress, normalizeResolvedAddress } from './proxy-security.mjs';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const VERSION = '3.0.0';
const require = createRequire(import.meta.url);
const packageDir = name => path.dirname(require.resolve(name));
wisp.options.allow_direct_ip = false;
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;
wisp.options.allow_udp_streams = false;
wisp.options.port_whitelist = [80, 443];
wisp.options.stream_limit_total = 128;
wisp.options.dns_method = async hostname => normalizeResolvedAddress((await lookup(hostname, {verbatim:true})).address);
wisp.options.hostname_blacklist = [new RegExp('^(localhost|.*[.]localhost|.*[.]local)$', 'i'), new RegExp('^metadata[.]google[.]internal$', 'i')];
const wispClients = new Map();
const activeWispSockets = new Set();
const MAX_WISP_CONNECTIONS_PER_IP = 32;
const mounts = [
  ['/scram/', scramjetPath],
  ['/utils/', packageDir('@mercuryworkshop/scramjet-utils')],
  ['/controller/', packageDir('@mercuryworkshop/scramjet-controller')],
  ['/libcurl/', packageDir('@mercuryworkshop/libcurl-transport')]
];
const TYPES = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8',
  '.woff2':'font/woff2','.wasm':'application/wasm','.map':'application/json; charset=utf-8'
};
const securityHeaders = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy':'same-origin',
  'Cross-Origin-Embedder-Policy':'require-corp',
  'Permissions-Policy':'camera=(self), microphone=(self), geolocation=(self), usb=(self), serial=(self), display-capture=(self), clipboard-read=(self), clipboard-write=(self)',
  'Content-Security-Policy':"default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; frame-src 'self' https: http: data: blob:; connect-src 'self' https: wss: ws: data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https:"
};
function send(res,status,body,type='application/json; charset=utf-8',extra={}) {
  res.writeHead(status,{...securityHeaders,'Content-Type':type,'Cache-Control':'no-store',...extra});
  res.end(body);
}
async function serveFile(req,res,base,relative) {
  const decoded = decodeURIComponent(relative);
  const resolved = path.resolve(base, decoded);
  const root = path.resolve(base);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return send(res,403,JSON.stringify({error:'Forbidden'}));
  const info = await stat(resolved);
  if (!info.isFile()) return send(res,404,JSON.stringify({error:'Not found'}));
  const ext = path.extname(resolved).toLowerCase();
  const cache = ext === '.html' || resolved.endsWith('/sw.js') ? 'no-cache' : 'public, max-age=3600';
  res.writeHead(200,{...securityHeaders,'Content-Type':TYPES[ext]||'application/octet-stream','Content-Length':info.size,'Cache-Control':cache});
  if (req.method === 'HEAD') return res.end();
  const data = await readFile(resolved);
  res.end(data);
}
const server = http.createServer(async(req,res)=>{
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res,405,JSON.stringify({error:'Method not allowed'}));
    const url = new URL(req.url,'http://localhost');
    if (url.pathname === '/api/health') return send(res,200,JSON.stringify({ok:true,app:'DaniOS',version:VERSION,proxy:{engine:'Scramjet',transport:'Epoxy/libcurl',tunnel:'Wisp WebSocket',ready:true},uptime:Math.round(process.uptime())}));
    if (url.pathname === '/api/version') return send(res,200,JSON.stringify({name:'DaniOS',version:VERSION,build:process.env.RAILWAY_GIT_COMMIT_SHA||process.env.FLY_IMAGE_REF||'local'}));
    if (url.pathname === '/api/capabilities') return send(res,200,JSON.stringify({hosting:process.env.RAILWAY_ENVIRONMENT?'Railway':process.env.FLY_APP_NAME?'Fly.io':'self-hosted',server:'Node.js',proxy:'Scramjet 2.x',transport:'libcurl over Wisp WebSocket',downloads:'Browser-managed; virtual-drive import is a separate action',cloudSync:false}));
    for (const [prefix,base] of mounts) {
      if (url.pathname.startsWith(prefix)) return await serveFile(req,res,base,url.pathname.slice(prefix.length));
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
    return await serveFile(req,res,ROOT,pathname.replace(/^\//,''));
  } catch(err) {
    if (err.code === 'ENOENT') return send(res,404,JSON.stringify({error:'Not found'}));
    if (err instanceof URIError) return send(res,400,JSON.stringify({error:'Invalid URL encoding'}));
    console.error(err);
    send(res,500,JSON.stringify({error:'Internal server error'}));
  }
});
server.on('upgrade',(req,socket,head)=>{
  let pathname, origin;
  try {
    pathname = new URL(req.url||'/','http://localhost').pathname;
    origin = new URL(req.headers.origin||'');
  } catch { socket.destroy(); return; }
  if (pathname !== '/wisp/' || !req.headers.host || origin.host.toLowerCase() !== req.headers.host.toLowerCase()) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  const ip = getClientAddress(req);
  const active = wispClients.get(ip) || 0;
  if (active >= MAX_WISP_CONNECTIONS_PER_IP) {
    socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  wispClients.set(ip, active + 1);
  activeWispSockets.add(socket);
  socket.once('close',()=>{
    activeWispSockets.delete(socket);
    const remaining = (wispClients.get(ip) || 1) - 1;
    if (remaining > 0) wispClients.set(ip,remaining);
    else wispClients.delete(ip);
  });
  req.url = '/wisp/';
  wisp.routeRequest(req,socket,head);
});
server.listen(PORT,'0.0.0.0',()=>console.log('DaniOS '+VERSION+' with Scramjet proxy listening on '+PORT));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{
  for (const socket of activeWispSockets) socket.destroy();
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0),5000).unref();
});
