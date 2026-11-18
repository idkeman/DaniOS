import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const enhancement = readFileSync(new URL('../enhancements.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../enhancements.css', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'Expected one inline application script');
new Function(scripts[0][1]);
new Function(enhancement);
for (const hook of ['startPanel','quickPanel','notifyPanel','desktopPanel','lockscreen','indexedDB','serviceWorker','data-browser','initPaint','renderTasks']) {
  assert.ok(html.includes(hook), 'Missing expected DaniOS shell hook: ' + hook);
}
for (const hook of ['renderExplorer','renderTrash','renderStore','initBrowser','connectFolder','requestDevice','getUserMedia','MediaRecorder','clipboard','timerstart','restoreBackup','setStartRenderer']) {
  assert.ok(enhancement.includes(hook), 'Missing enhanced feature: ' + hook);
}
for (const path of ['README.md','manifest.webmanifest','sw.js','enhancements.css']) {
  assert.ok(existsSync(new URL('../'+path, import.meta.url)), 'Missing required file: '+path);
}
assert.ok(css.includes('.x-explorer') && css.includes('.enh-dark'), 'Missing enhanced app styles');
assert.ok(!html.includes('dataset-browser'), 'Found malformed browser data attribute access');
console.log('DaniOS checks passed: inline and enhancement JavaScript parse; app shell assets and core feature hooks exist.');
