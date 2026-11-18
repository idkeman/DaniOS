import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { getClientAddress, normalizeResolvedAddress } from '../proxy-security.mjs';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const enhancement=await readFile(new URL('../enhancements.js',import.meta.url),'utf8');

test('all DaniOS JavaScript parses',()=>{
  const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(inline.length,1);
  assert.doesNotThrow(()=>new Function(inline[0][1]));
  assert.doesNotThrow(()=>new Function(enhancement));
});

test('enhanced apps and device integrations are registered',()=>{
  for(const app of ['appstore','help','notes','todo','clipboard','camera','device','unitconverter','weather','systemmonitor','recycle']){
    assert.ok(enhancement.includes("['"+app+"'")||enhancement.includes(app+':'), 'Missing '+app);
  }
  for(const api of ['showDirectoryPicker','navigator.bluetooth','navigator.usb','navigator.serial','getUserMedia','MediaRecorder','navigator.clipboard','navigator.wakeLock','getDisplayMedia']){
    assert.ok(enhancement.includes(api),'Missing browser API integration: '+api);
  }
});


test('every enhanced data-x button has an implemented action',()=>{
  const actions=[...new Set([...enhancement.matchAll(/data-x=["']([^"']+)["']/g)].map(m=>m[1]))];
  const handled=new Set([...enhancement.matchAll(/a===["']([^"']+)["']/g)].map(m=>m[1]));
  for(const action of actions)assert.ok(handled.has(action),'Unimplemented button action: '+action);
  assert.ok(enhancement.includes("data-paint"));
  assert.ok(html.includes("data-calendar"));
});
test('proxy security normalizes mapped IPv6 and uses trusted Railway client IPs',()=>{
  const request={headers:{'x-real-ip':'198.51.100.23'},socket:{remoteAddress:'100.64.0.2'}};
  assert.equal(getClientAddress(request,true),'198.51.100.23');
  assert.equal(getClientAddress(request,false),'100.64.0.2');
  assert.equal(getClientAddress({...request,headers:{'x-real-ip':'not-an-ip'}},true),'100.64.0.2');
  assert.equal(normalizeResolvedAddress('::ffff:127.0.0.1'),'127.0.0.1');
  assert.equal(normalizeResolvedAddress('::ffff:10.0.0.1'),'10.0.0.1');
  assert.equal(normalizeResolvedAddress('::ffff:8.8.8.8'),'8.8.8.8');
  assert.equal(normalizeResolvedAddress('2001:4860:4860::8888'),'2001:4860:4860::8888');
});

test('Railway uses current IaC and not deprecated per-service config',async()=>{
  const railway=await readFile(new URL('../.railway/railway.ts',import.meta.url),'utf8');
  assert.match(railway,/defineRailway/);
  assert.match(railway,/github\("idkeman\/DaniOS"/);
  assert.match(railway,/healthcheck: "\/api\/health"/);
  await assert.rejects(readFile(new URL('../railway.json',import.meta.url),'utf8'));
});

function websocketHandshake(port,path,origin,clientIp='198.51.100.42'){
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection({host:'127.0.0.1',port});
    let response='';
    const timeout=setTimeout(()=>{socket.destroy();reject(new Error('WebSocket handshake timed out'));},3000);
    socket.once('error',error=>{clearTimeout(timeout);reject(error);});
    socket.on('data',chunk=>{
      response+=chunk.toString('latin1');
      if(response.includes('\r\n\r\n')){
        clearTimeout(timeout);
        resolve({status:Number(response.match(/^HTTP\/1\.1 (\d+)/)?.[1]||0),socket});
      }
    });
    socket.once('connect',()=>{
      socket.write([
        'GET '+path+' HTTP/1.1',
        'Host: 127.0.0.1:'+port,
        'Connection: Upgrade',
        'Upgrade: websocket',
        'Sec-WebSocket-Version: 13',
        'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
        'Origin: '+origin,
        'X-Real-IP: '+clientIp,
        '\r\n'
      ].join('\r\n'));
    });
  });
}

test('Railway server health, static hosting, WebSocket origin and connection limits',async t=>{
  const probe=net.createServer();
  await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),RAILWAY_ENVIRONMENT:'test'},stdio:'ignore'});
  t.after(()=>child.kill('SIGTERM'));
  let response;
  for(let i=0;i<50;i++){
    try{response=await fetch('http://127.0.0.1:'+port+'/api/health');if(response.ok)break;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(response&&response.ok,'Server did not become healthy');
  const health=await response.json();
  assert.equal(health.ok,true);
  assert.equal(health.app,'DaniOS');
  assert.equal(health.version,'3.0.0');
  const page=await fetch('http://127.0.0.1:'+port+'/');
  assert.equal(page.status,200);
  assert.match(page.headers.get('content-type'),/text\/html/);
  assert.equal(page.headers.get('x-content-type-options'),'nosniff');
  assert.equal(page.headers.get('cross-origin-opener-policy'),'same-origin');
  assert.equal(page.headers.get('cross-origin-embedder-policy'),'require-corp');
  const traversal=await fetch('http://127.0.0.1:'+port+'/%2e%2e/%2e%2e/etc/passwd');
  assert.equal(traversal.status,404);
  const runtime=await fetch('http://127.0.0.1:'+port+'/controller/controller.sw.js');
  assert.equal(runtime.status,200);
  assert.match(runtime.headers.get('content-type'),/javascript/);
  const method=await fetch('http://127.0.0.1:'+port+'/api/health',{method:'POST'});
  assert.equal(method.status,405);
  const version=await fetch('http://127.0.0.1:'+port+'/api/version');
  assert.equal((await version.json()).version,'3.0.0');
  const capabilities=await fetch('http://127.0.0.1:'+port+'/api/capabilities');
  assert.equal(capabilities.status,200);
  assert.equal((await capabilities.json()).proxy,'Scramjet 2.x');
  const wrongOrigin=await websocketHandshake(port,'/wisp/','https://attacker.example');
  assert.equal(wrongOrigin.status,403);
  wrongOrigin.socket.destroy();
  const wrongPath=await websocketHandshake(port,'/not-wisp/','http://127.0.0.1:'+port);
  assert.equal(wrongPath.status,403);
  wrongPath.socket.destroy();
  const openSockets=[];
  try{
    for(let i=0;i<32;i++){
      const result=await websocketHandshake(port,'/wisp/','http://127.0.0.1:'+port);
      assert.equal(result.status,101);
      openSockets.push(result.socket);
    }
    const limited=await websocketHandshake(port,'/wisp/','http://127.0.0.1:'+port);
    assert.equal(limited.status,429);
    limited.socket.destroy();
    const otherClient=await websocketHandshake(port,'/wisp/','http://127.0.0.1:'+port,'198.51.100.43');
    assert.equal(otherClient.status,101);
    otherClient.socket.destroy();
  }finally{
    for(const socket of openSockets)socket.destroy();
  }
});
