// Even Hub apps are web pages that run in a WebView inside the Even app. They do not draw
// pixels: they send page descriptions (containers) to the host through
// window.flutter_inappwebview.callHandler('evenAppMessage', json). This adapter stands in for
// the host, records what the app sends, and returns the page it ends up showing.

function hostStub() {
  window.__osgCalls = [];
  const replies = {
    createStartUpPageContainer: 0,
    rebuildPageContainer: true,
    textContainerUpgrade: true,
    updateImageRawData: 'success',
    shutDownPageContainer: true,
    getUserInfo: { uid: 0, name: '', avatar: '', country: '' },
    getLocalStorage: '',
  };
  window.flutter_inappwebview = {
    callHandler: async (_name, raw) => {
      let message = raw;
      try {
        if (typeof raw === 'string') message = JSON.parse(raw);
      } catch {
        return null;
      }
      const method = message?.method;
      if (typeof method !== 'string') return null;
      window.__osgCalls.push({ method, data: message.data ?? null });
      return method in replies ? replies[method] : true;
    },
  };
}

const rect = c => ({
  id: c.containerID ?? null,
  name: c.containerName ?? '',
  x: c.xPosition ?? 0,
  y: c.yPosition ?? 0,
  width: c.width ?? 0,
  height: c.height ?? 0,
  eventCapture: c.isEventCapture === 1,
});

function toPage(data) {
  const containers = [];
  for (const c of data?.textObject ?? []) {
    const content = c.content ?? '';
    containers.push({ kind: 'text', ...rect(c), content, createdChars: [...content].length, createdBytes: utf8Bytes(content) });
  }
  for (const c of data?.listObject ?? []) {
    containers.push({ kind: 'list', ...rect(c), items: c.itemContainer?.itemName ?? [] });
  }
  for (const c of data?.imageObject ?? []) containers.push({ kind: 'image', ...rect(c) });
  return containers;
}

// Replays the recorded calls: the last page created or rebuilt, with later text updates applied.
// The host counts text in UTF-8 bytes.
export const utf8Bytes = s => new TextEncoder().encode(s).length;

export function replay(calls) {
  let containers = null;
  let pages = 0;
  const updates = [];
  for (const { method, data } of calls) {
    if (method === 'createStartUpPageContainer' || method === 'rebuildPageContainer') {
      containers = toPage(data);
      pages++;
    } else if (method === 'textContainerUpgrade' && containers) {
      const content = data?.content ?? '';
      updates.push({ id: data?.containerID ?? null, name: data?.containerName ?? '', content });
      const target = containers.find(c => c.kind === 'text' && (c.id === data?.containerID || c.name === data?.containerName));
      if (target) target.content = content;
    }
  }
  return { containers, pages, updates };
}

// A single tap as the host sends it, and as an app might expect it. The host leaves out
// zero values: a tap carries no eventType (CLICK_EVENT is 0), and a tap on the first list
// item carries no index. Observed in simulator 0.9.5 (data/records/even-g2/tap-has-no-event-type.json).
export function tapForms(container) {
  const target = { containerID: container.id, containerName: container.name };
  if (container.kind === 'list') {
    return {
      device: ['listEvent', target],
      typed: ['listEvent', { ...target, currentSelectItemIndex: 0, currentSelectItemName: container.items[0] ?? '', eventType: 0 }],
    };
  }
  return {
    device: ['sysEvent', { eventSource: 1 }],
    typed: ['sysEvent', { eventType: 0, eventSource: 1 }],
    ...(container.kind === 'text' ? { text: ['textEvent', target] } : {}),
  };
}

// Sends one event the way the host does. Returns the host calls the app makes before any
// timer can run, or null when the app has no event listener.
const inject = (page, data) =>
  page.evaluate(async data => {
    if (typeof window._listenEvenAppMessage !== 'function') return null;
    const before = window.__osgCalls.length;
    window._listenEvenAppMessage(JSON.stringify({ type: 'ListenEvenAppData', method: 'evenHubEvent', data }));
    for (let i = 0; i < 100; i++) await Promise.resolve();
    return window.__osgCalls.length - before;
  }, data);

// Same sequence of random numbers on every load.
function seedRandom() {
  let seed = 1;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const START = new Date('2026-01-01T00:00:00Z').getTime();

// Moves the app's clock forward in steps, letting network replies land in between.
async function advance(page, ms) {
  for (let t = 0; t < ms; t += 100) {
    await page.clock.runFor(100);
    await page.waitForTimeout(20);
  }
}

// Loads the app with its clock paused, sends one event (or none), and counts the host calls
// in the next two seconds of app time. Two loads reach the same state, so a difference in
// the count is the app answering the event.
async function callsAfter(context, url, settleMs, data) {
  const page = await context.newPage();
  try {
    await page.clock.install({ time: START });
    await page.clock.pauseAt(START + 1);
    await page.addInitScript(hostStub);
    await page.addInitScript(seedRandom);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await advance(page, settleMs);
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => window.__osgCalls.length);
    if (data) await inject(page, data);
    await advance(page, 2000);
    await page.waitForTimeout(300);
    await page.clock.runFor(100);
    return (await page.evaluate(() => window.__osgCalls.length)) - before;
  } finally {
    await page.close();
  }
}

// Taps the event container in each form and records which forms the app answers.
// An app that answers the device form at once needs nothing more. Otherwise each form gets
// a fresh load, compared with a load that gets no event, and an answer to a form other than
// the device form is checked once more before it counts.
async function probeTaps(page, context, url, containers, settleMs) {
  const capturing = containers?.filter(c => c.eventCapture) ?? [];
  if (capturing.length !== 1) return null;
  const forms = tapForms(capturing[0]);
  const immediate = await inject(page, forms.device);
  if (immediate === null) return null;
  const taps = { container: capturing[0].kind, answers: { device: immediate > 0 } };
  if (immediate) return taps;

  const control = await callsAfter(context, url, settleMs, null);
  const answers = async name => (await callsAfter(context, url, settleMs, forms[name])) > control;
  taps.answers.device = await answers('device');
  if (taps.answers.device) return taps;
  for (const name of ['typed', 'text'].filter(n => forms[n])) {
    taps.answers[name] = (await answers(name)) && !(await answers('device')) && (await answers(name));
  }
  return taps;
}

export async function captureEven(browser, url, device, { settleMs = 2500, taps = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.addInitScript(hostStub);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(settleMs);
    const calls = await page.evaluate(() => window.__osgCalls ?? []);
    const shown = replay(calls);
    return {
      viewport: device.display.viewport.value,
      title: await page.title(),
      methods: [...new Set(calls.map(c => c.method))],
      ...shown,
      taps: taps ? await probeTaps(page, context, url, shown.containers, settleMs) : null,
    };
  } finally {
    await context.close();
  }
}
