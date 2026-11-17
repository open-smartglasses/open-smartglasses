#!/usr/bin/env node
// Probe for data/records/even-g2/sdk-timer-id-collision.json.
// Loads a published Even Hub SDK in Chromium and checks whether clearing a timer
// created before the SDK loaded cancels a timer created after it.
//   node scripts/probes/even-sdk-timers.mjs [--sdk 0.0.16] [--json]
import { launch } from '../../packages/lint/src/browser.js';
import { sdkVersion, sdkSource } from './lib.mjs';

const args = process.argv.slice(2);
const version = sdkVersion(args);

// A page that holds native timers before the SDK loads, then starts an interval after it.
// With clear=true it clears its own native timer that has the interval's id.
const page = clear => `<!doctype html>
<script>
  window.nativeSetTimeout = window.setTimeout;
  window.held = Array.from({ length: 20 }, () => setTimeout(() => {}, 60000));
</script>
<script type="module">
  import './sdk.js';
  window.patched = window.setTimeout !== window.nativeSetTimeout;
  window.ticks = 0;
  window.interval = setInterval(() => window.ticks++, 100);
  window.collides = window.held.includes(window.interval);
  if (${clear} && window.collides) clearTimeout(window.interval);
  window.ready = true;
</script>`;

async function run(browser, sdk, clear) {
  const context = await browser.newContext();
  const tab = await context.newPage();
  await tab.route('https://probe.test/**', route => {
    const isSdk = route.request().url().endsWith('/sdk.js');
    route.fulfill({ contentType: isSdk ? 'text/javascript' : 'text/html', body: isSdk ? sdk : page(clear) });
  });
  await tab.goto('https://probe.test/');
  await tab.waitForFunction('window.ready === true');
  await tab.waitForTimeout(2500);
  const result = await tab.evaluate(() => ({ patched: window.patched, interval: window.interval, collides: window.collides, ticks: window.ticks }));
  await context.close();
  return result;
}

const sdk = await sdkSource(version);
const browser = await launch();
try {
  const without = await run(browser, sdk, false);
  const withClear = await run(browser, sdk, true);
  const result = {
    sdk: version,
    browser: `Chromium ${browser.version()}`,
    patched: without.patched,
    intervalId: without.interval,
    idCollides: without.collides,
    ticksWithoutClear: without.ticks,
    ticksAfterClear: withClear.ticks,
    reproduced: without.collides && without.ticks > 0 && withClear.ticks === 0,
  };
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`SDK ${result.sdk}, ${result.browser}`);
    console.log(`Timers replaced by the SDK: ${result.patched ? 'yes' : 'no'}`);
    console.log(`First SDK interval id ${result.intervalId}, same as a native timer: ${result.idCollides ? 'yes' : 'no'}`);
    console.log(`Interval ticks in 2.5 s: ${result.ticksWithoutClear}; after clearing the native timer: ${result.ticksAfterClear}`);
    console.log(result.reproduced ? 'Reproduced.' : 'Not reproduced.');
  }
} finally {
  await browser.close();
}
