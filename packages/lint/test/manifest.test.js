import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintManifest } from '../src/index.js';

const fixture = name => path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'manifest', name);
const found = name => lintManifest(fixture(name)).findings.map(f => `${f.severity} ${f.rule}`);

test('a manifest within the store rules passes', () => {
  assert.deepEqual(found('good.json'), []);
});

const cases = [
  ['old-sdk.json', ['error manifest/min-sdk']],
  ['no-sdk.json', ['error manifest/min-sdk']],
  ['even-name.json', ['warn manifest/name']],
  ['no-whitelist.json', ['warn manifest/network-whitelist']],
];
for (const [name, expected] of cases) {
  test(`${name} reports ${expected.join(', ')}`, () => assert.deepEqual(found(name), expected));
}

test('manifest findings cite the store rule in the profile', () => {
  const [finding] = lintManifest(fixture('old-sdk.json')).findings;
  assert.equal(finding.basis, 'vendor');
  assert.equal(finding.grade, 'docs');
  assert.match(finding.source, /app-submission/);
  assert.match(finding.message, /0\.0\.10.*0\.0\.14/);
});

test('a manifest is only checked for a device with store rules', () => {
  assert.throws(() => lintManifest(fixture('good.json'), { device: 'mrbd' }), /Even Hub/);
});
