import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../src/index.js';
import { replay } from '../src/capture-even.js';
import { launch } from '../src/browser.js';

const fixture = name => path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'even', name);
const found = result => result.findings.map(f => `${f.severity} ${f.rule}`);

let browser;
before(async () => {
  browser = await launch();
});
after(() => browser.close());

// The fixtures build their page at once, so a short settle is enough.
const run = name => lint(fixture(name), { device: 'even-g2', browser, settleMs: 500 });

test('a page within the limits passes', async () => {
  const result = await run('good.html');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.viewport, [576, 288]);
  assert.equal(result.metrics.containers, 3);
  assert.deepEqual(result.metrics.hostCalls, ['createStartUpPageContainer']);
});

// Each fixture breaks one rule and nothing else.
const cases = [
  ['too-many.html', ['error container/count', 'error container/count']],
  ['bounds.html', ['error container/bounds']],
  ['image-size.html', ['error container/image-size']],
  ['name.html', ['error container/name']],
  ['capture-none.html', ['error input/event-capture']],
  ['capture-two.html', ['error input/event-capture']],
  ['list.html', ['error list/length', 'error list/length', 'info input/many-choices']],
  ['list-korean.html', ['error list/length']],
  ['choices.html', ['info input/many-choices']],
  ['text.html', ['error text/length']],
  ['text-korean.html', ['error text/length']],
  ['update.html', ['error text/length']],
  ['none.html', ['warn page/none']],
  ['tap-typed.html', ['warn input/tap-form']],
  ['tap-text.html', ['warn input/tap-form']],
  ['tap-list-typed.html', ['warn input/tap-form']],
];
for (const [name, expected] of cases) {
  test(`${name} reports ${expected.join(', ')}`, async () => {
    assert.deepEqual(found(await run(name)), expected);
  });
}

test('findings carry the fact from the device profile', async () => {
  const [finding] = (await run('image-size.html')).findings;
  assert.equal(finding.basis, 'vendor');
  assert.equal(finding.grade, 'docs');
  assert.match(finding.source, /hub\.evenrealities\.com/);
  assert.deepEqual(finding.nodes, [{ selector: 'image "i2"', text: '400x200' }]);
});

test('the page checked is the last one the app built', async () => {
  const result = await run('rebuild.html');
  assert.deepEqual(result.findings, []);
  assert.equal(result.metrics.pagesCreated, 2);
});

test('text updates replace the content of the container they name', () => {
  const page = { textObject: [{ containerID: 1, containerName: 'a', content: 'one' }] };
  const { containers, updates } = replay([
    { method: 'createStartUpPageContainer', data: page },
    { method: 'textContainerUpgrade', data: { containerID: 1, content: 'two' } },
  ]);
  assert.equal(containers[0].content, 'two');
  assert.equal(containers[0].createdChars, 3);
  assert.equal(updates.length, 1);
});

test('an app that answers the tap the host sends passes', async () => {
  const result = await run('tap-good.html');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.metrics.taps.answers, { device: true });
});

test('an app that ignores the first event it gets is not reported', async () => {
  const result = await run('tap-warmup.html');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.metrics.taps.answers, { device: false, typed: false, text: false });
});

test('a tap answered after a network round trip and a timer counts', async () => {
  assert.deepEqual(found(await run('tap-fetch-typed.html')), ['warn input/tap-form']);
});

test('a clock that updates every second is not taken for an answer', async () => {
  const result = await run('tap-clock.html');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.metrics.taps.answers, { device: false, typed: false, text: false });
});

test('a page with no event listener is not tapped', async () => {
  const result = await run('good.html');
  assert.equal(result.metrics.taps, null);
});

test('tap findings cite their record', async () => {
  const [finding] = (await run('tap-typed.html')).findings;
  assert.equal(finding.basis, 'record');
  assert.equal(finding.grade, 'simulator');
  assert.match(finding.source, /data\/records\/even-g2\/tap-has-no-event-type\.json$/);
});

test('taps can be turned off', async () => {
  const result = await lint(fixture('tap-typed.html'), { device: 'even-g2', browser, taps: false });
  assert.deepEqual(result.findings, []);
});
