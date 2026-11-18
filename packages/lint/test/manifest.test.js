import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { lintManifest, loadDevice } from '../src/index.js';
import { checkManifest } from '../src/manifest.js';

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

const good = JSON.parse(readFileSync(fixture('good.json'), 'utf8'));
const even = loadDevice('even-g2');

test('min_sdk_version is compared as semver', () => {
  const sdk = v => checkManifest({ ...good, min_sdk_version: v }, even).map(f => `${f.severity} ${f.rule}`);
  for (const v of ['0.0.10', '0.0.13', '0.0.14-rc.1']) assert.deepEqual(sdk(v), ['error manifest/min-sdk'], v);
  for (const v of ['0.0.14', '0.0.14+build.1', '0.0.15-rc.1', '0.1.0', '1.0.0']) assert.deepEqual(sdk(v), [], v);
  for (const v of ['', 'v0.0.14', '0.0', 14]) assert.deepEqual(sdk(v), ['warn manifest/min-sdk'], String(v));
});

test('every network permission needs a whitelist', () => {
  const permissions = [good.permissions[0], { name: 'network', desc: 'Fetches more.' }];
  const findings = checkManifest({ ...good, permissions }, even);
  assert.deepEqual(findings.map(f => f.rule), ['manifest/network-whitelist']);
  assert.match(findings[0].message, /^permissions\[1\]/);
});

test('a manifest is only checked for a device with store rules', () => {
  assert.throws(() => lintManifest(fixture('good.json'), { device: 'mrbd' }), /Even Hub/);
});
