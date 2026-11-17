#!/usr/bin/env node
// Probe for data/records/even-g2/background-state-skill-missing-api.json.
// Loads a published Even Hub SDK in Chromium and lists which of the named exports it has.
//   node scripts/probes/even-sdk-exports.mjs [--sdk 0.0.16] [--names setBackgroundState,onBackgroundRestore]
import { launch } from '../../packages/lint/src/browser.js';
import { sdkVersion, sdkSource } from './lib.mjs';

const args = process.argv.slice(2);
const version = sdkVersion(args);
const names = (args.includes('--names') ? args[args.indexOf('--names') + 1] : 'setBackgroundState,onBackgroundRestore').split(',');

const sdk = await sdkSource(version);
const browser = await launch();
try {
  const tab = await (await browser.newContext()).newPage();
  await tab.route('https://probe.test/**', route =>
    route.fulfill(route.request().url().endsWith('/sdk.js') ? { contentType: 'text/javascript', body: sdk } : { contentType: 'text/html', body: '<!doctype html>' }),
  );
  await tab.goto('https://probe.test/');
  const exported = await tab.evaluate(async () => Object.keys(await import('/sdk.js')));
  console.log(`SDK ${version}, Chromium ${browser.version()}: ${exported.length} exports`);
  for (const name of names) console.log(`${name}: ${exported.includes(name) ? 'exported' : 'missing'}`);
} finally {
  await browser.close();
}
