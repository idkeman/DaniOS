import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'Expected one inline application script');
new Function(scripts[0][1]);
for (const hook of ['startPanel','quickPanel','notifyPanel','desktopPanel','lockscreen','indexedDB','serviceWorker','data-browser','initPaint','renderTasks']) {
  assert.ok(html.includes(hook), 'Missing expected DaniOS feature hook: ' + hook);
}
assert.ok(!html.includes('dataset-browser'), 'Found a malformed browser data attribute access');
console.log('DaniOS checks passed: inline JavaScript parses and core shell hooks exist.');
