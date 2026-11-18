import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';

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
test('Railway uses current IaC and not deprecated per-service config',async()=>{
  const railway=await readFile(new URL('../.railway/railway.ts',import.meta.url),'utf8');
  assert.match(railway,/defineRailway/);
  assert.match(railway,/github\("idkeman\/DaniOS"/);
  assert.match(railway,/healthcheck: "\/api\/health"/);
  await assert.rejects(readFile(new URL('../railway.json',import.meta.url),'utf8'));
});

test('Railway server health, static hosting and security headers',async t=>{
  const probe=net.createServer();
  await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'ignore'});
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
  const version=await fetch('http://127.0.0.1:'+port+'/api/version');
  assert.equal((await version.json()).version,'3.0.0');
});
