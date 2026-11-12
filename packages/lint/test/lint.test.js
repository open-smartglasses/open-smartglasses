import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../src/index.js';
import { launch } from '../src/browser.js';

const fixture = name => path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);
const rulesOf = (result, severity) => result.findings.filter(f => f.severity === severity).map(f => f.rule);

let browser;
before(async () => {
  browser = await launch();
});
after(() => browser.close());

const run = name => lint(fixture(name), { device: 'mrbd', browser });

test('a screen that follows the rules passes', async () => {
  const result = await run('good.html');
  assert.deepEqual(result.findings, []);
});

test('text below the vendor minimum is an error, text below 0.6 degrees a warning', async () => {
  const result = await run('small-text.html');
  assert.deepEqual(rulesOf(result, 'error'), ['text/min-size']);
  assert.deepEqual(rulesOf(result, 'warn'), ['text/min-size']);
  const [error, warning] = result.findings;
  assert.deepEqual(error.nodes.map(n => n.px), [12]);
  assert.deepEqual(warning.nodes.map(n => n.px), [18]);
  assert.equal(error.basis, 'vendor');
  assert.equal(warning.basis, 'derived');
  assert.equal(warning.grade, 'press');
});

test('thin font weight is a warning', async () => {
  const result = await run('thin.html');
  assert.deepEqual(rulesOf(result, 'warn'), ['text/thin-weight']);
  assert.equal(result.summary.errors, 0);
});

test('a bright full-screen fill is a warning', async () => {
  const result = await run('bright.html');
  assert.deepEqual(rulesOf(result, 'warn'), ['display/bright-fill']);
});

test('content wider than the viewport is an error', async () => {
  const result = await run('wide.html');
  assert.deepEqual(rulesOf(result, 'error'), ['layout/overflow']);
});

test('an unknown device is rejected with the list of known ones', async () => {
  await assert.rejects(() => lint(fixture('good.html'), { device: 'nope', browser }), /Unknown device "nope".*mrbd/);
});
