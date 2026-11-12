import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../src/index.js';
import { launch } from '../src/browser.js';

const fixture = name => path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);
const found = result => result.findings.map(f => `${f.severity} ${f.rule}`);

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
  assert.deepEqual(found(result), ['error text/min-size', 'warn text/min-size']);
  const [error, warning] = result.findings;
  assert.deepEqual(error.nodes.map(n => n.px), [12]);
  assert.deepEqual(warning.nodes.map(n => n.px), [18]);
  assert.equal(error.basis, 'vendor');
  assert.equal(warning.basis, 'derived');
  assert.equal(warning.grade, 'press');
});

// Each fixture breaks one rule and nothing else.
const cases = [
  ['thin.html', ['warn text/thin-weight']],
  ['condensed.html', ['warn text/condensed']],
  ['wide.html', ['error layout/overflow']],
  ['no-viewport.html', ['error layout/viewport-meta']],
  ['no-zoom.html', ['warn layout/viewport-meta']],
  ['fixed-viewport.html', ['warn layout/viewport-meta']],
  ['nested-scroll.html', ['warn layout/nested-scroll']],
  ['tabindex.html', ['error input/positive-tabindex']],
  ['back-button.html', ['warn input/in-app-back']],
  ['unnamed.html', ['warn input/unnamed-control']],
  ['password.html', ['warn input/text-entry']],
  ['many.html', ['info input/many-choices']],
  ['image.html', ['warn display/image-alt']],
];
for (const [name, expected] of cases) {
  test(`${name} reports ${expected.join(', ')}`, async () => {
    assert.deepEqual(found(await run(name)), expected);
  });
}

test('a white page with dark text breaks three display rules', async () => {
  const result = await run('bright.html');
  assert.deepEqual(found(result), ['info text/dark-on-light', 'warn display/background', 'warn display/bright-fill']);
});

test('an unknown device is rejected with the list of known ones', async () => {
  await assert.rejects(() => lint(fixture('good.html'), { device: 'nope', browser }), /Unknown device "nope".*mrbd/);
});
