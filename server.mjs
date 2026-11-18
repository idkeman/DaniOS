import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const VERSION = '3.0.0';
const TYPES = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'
};
const headers = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(self), microphone=(self), geolocation=(self), bluetooth=(self), usb=(self), serial=(self), display-capture=(self), clipboard-read=(self), clipboard-write=(self)',
  'Content-Security-Policy':"default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; frame-src https: http:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; form-action 'self' https:"
};
function send(res,status,body,type='application/json; charset=utf-8',extra={}) {
  res.writeHead(status,{...headers,'Content-Type':type,'Cache-Control':'no-store',...extra});
  res.end(body);
}
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,JSON.stringify({error:'Method not allowed'}));
    if(url.pathname==='/api/health')return send(res,200,JSON.stringify({ok:true,app:'DaniOS',version:VERSION,uptime:Math.round(process.uptime())}));
    if(url.pathname==='/api/version')return send(res,200,JSON.stringify({name:'DaniOS',version:VERSION,build:process.env.RAILWAY_GIT_COMMIT_SHA||'local'}));
    if(url.pathname==='/api/capabilities')return send(res,200,JSON.stringify({hosting:'Railway',server:'Node.js',browserFeatures:'permission-gated',cloudSync:false,notes:'User files remain local to the browser profile.'}));
    let pathname=decodeURIComponent(url.pathname);
    if(pathname==='/'||pathname.endsWith('/'))pathname+='index.html';
    const resolved=path.resolve(ROOT,'.'+pathname);
    if(!resolved.startsWith(ROOT+path.sep)&&resolved!==ROOT)return send(res,403,JSON.stringify({error:'Forbidden'}));
    const info=await stat(resolved);
    if(!info.isFile())return send(res,404,JSON.stringify({error:'Not found'}));
    const data=await readFile(resolved);
    const ext=path.extname(resolved).toLowerCase();
    const cache=ext==='.html'?'no-cache':'public, max-age=3600';
    res.writeHead(200,{...headers,'Content-Type':TYPES[ext]||'application/octet-stream','Content-Length':data.length,'Cache-Control':cache});
    res.end(req.method==='HEAD'?undefined:data);
  } catch(err) {
    if(err.code==='ENOENT')return send(res,404,JSON.stringify({error:'Not found'}));
    console.error(err);
    send(res,500,JSON.stringify({error:'Internal server error'}));
  }
});
server.listen(PORT,'0.0.0.0',()=>console.log('DaniOS '+VERSION+' listening on '+PORT));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
