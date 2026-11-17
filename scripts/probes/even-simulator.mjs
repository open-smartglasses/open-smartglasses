#!/usr/bin/env node
// Probe for records in data/records/even-g2, run in the official Even Hub simulator:
//   tap-has-no-event-type, quickstart-reads-taps-from-text-event, press-delivers-two-events
//     what a tap and a double tap deliver
//   hot-reload-blank-display
//     creating the page again in the same launch and after a reload
//
//   node scripts/probes/even-simulator.mjs --simulator <path to evenhub-simulator binary> [--sdk 0.0.16] [--reloads 3]
//
// The simulator opens a window. Install it with: npm install @evenrealities/evenhub-simulator
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { sdkVersion, sdkSource } from './lib.mjs';

const args = process.argv.slice(2);
const simulator = args.includes('--simulator') ? args[args.indexOf('--simulator') + 1] : 'evenhub-simulator';
const version = sdkVersion(args);
const RELOADS = args.includes('--reloads') ? Number(args[args.indexOf('--reloads') + 1]) : 3;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Every line the app logs starts with "osg " and carries JSON.
const app = `<!doctype html>
<meta charset="utf-8">
<script type="module">
  import { waitForEvenAppBridge } from './sdk.js';
  const log = (what, data) => console.log('osg ' + JSON.stringify({ what, ...data }));
  const bridge = await waitForEvenAppBridge();

  // Raw messages from the host, before the SDK parses them.
  const listen = window._listenEvenAppMessage;
  if (typeof listen === 'function') {
    window._listenEvenAppMessage = message => {
      log('raw', { message: typeof message === 'string' ? message : JSON.stringify(message) });
      return listen(message);
    };
  }

  const load = Number(sessionStorage.getItem('osg-load') || 0) + 1;
  sessionStorage.setItem('osg-load', String(load));
  const page = n => ({
    containerTotalNum: 1,
    textObject: [{ xPosition: 0, yPosition: 0, width: 576, height: 288, containerID: 1, containerName: 'probe',
      content: 'load ' + load + ' ' + n, isEventCapture: 1 }],
  });

  log('create', { load, result: await bridge.createStartUpPageContainer(page('create')) });
  if (load === 1) log('create-again', { load, result: await bridge.createStartUpPageContainer(page('again')) });
  if (load > 1) log('rebuild', { load, result: await bridge.rebuildPageContainer(page('rebuild')) });

  bridge.onEvenHubEvent(event => {
    const parts = {};
    for (const key of ['sysEvent', 'textEvent', 'listEvent']) {
      if (event[key]) parts[key] = { keys: Object.keys(event[key]), value: event[key] };
    }
    log('event', parts);
  });

  if (load <= ${RELOADS}) setTimeout(() => location.reload(), 1500);
  else log('ready', { load });
</script>
`;

async function serve(sdk) {
  const server = createServer((req, res) => {
    const isSdk = req.url.endsWith('/sdk.js');
    res.writeHead(200, { 'content-type': isSdk ? 'text/javascript' : 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(isSdk ? sdk : app);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
}

async function api(port, path, options) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.headers.get('content-type')?.includes('json') ? response.json() : response.text();
}

// Console entries the app logged, parsed.
async function logs(port) {
  const body = await api(port, '/api/console');
  const entries = Array.isArray(body) ? body : body.entries ?? body.logs ?? [];
  return entries
    .map(e => String(e.message ?? e.text ?? e))
    .map(m => m.slice(m.indexOf('osg ')))
    .filter(m => m.startsWith('osg '))
    .map(m => JSON.parse(m.slice(4)));
}

async function until(test, ms, what) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(250)) {
    try {
      const value = await test();
      if (value) return value;
    } catch {}
  }
  throw new Error(`Timed out waiting for ${what}.`);
}

const sdk = await sdkSource(version);
const server = await serve(sdk);
const appUrl = `http://127.0.0.1:${server.address().port}/`;
const port = 39800 + Math.floor(Math.random() * 100);
const child = spawn(simulator, [appUrl, '--automation-port', String(port), '--no-glow'], { stdio: 'ignore' });

try {
  const simVersion = await new Promise((resolve, reject) => {
    const v = spawn(simulator, ['--version']);
    let out = '';
    v.stdout.on('data', d => (out += d));
    v.on('close', () => resolve(out.trim()));
    v.on('error', reject);
  });
  await until(() => api(port, '/api/ping'), 30000, 'the simulator');
  await until(async () => (await logs(port)).some(l => l.what === 'ready'), 60000, 'the reloads');

  const before = (await logs(port)).length;
  await api(port, '/api/input', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'click' }) });
  await sleep(1500);
  const afterClick = (await logs(port)).length;
  await api(port, '/api/input', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'double_click' }) });
  await sleep(1500);

  const all = await logs(port);
  const pick = (from, to) => all.slice(from, to);
  const result = {
    sdk: version,
    simulator: simVersion,
    pages: all.filter(l => ['create', 'create-again', 'rebuild'].includes(l.what)).map(({ what, load, result }) => ({ what, load, result })),
    click: { events: pick(before, afterClick).filter(l => l.what === 'event'), raw: pick(before, afterClick).filter(l => l.what === 'raw') },
    doubleClick: { events: pick(afterClick).filter(l => l.what === 'event'), raw: pick(afterClick).filter(l => l.what === 'raw') },
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  child.kill();
  server.close();
}
