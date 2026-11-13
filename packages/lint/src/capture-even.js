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
    containers.push({ kind: 'text', ...rect(c), content, createdChars: content.length });
  }
  for (const c of data?.listObject ?? []) {
    containers.push({ kind: 'list', ...rect(c), items: c.itemContainer?.itemName ?? [] });
  }
  for (const c of data?.imageObject ?? []) containers.push({ kind: 'image', ...rect(c) });
  return containers;
}

// Replays the recorded calls: the last page created or rebuilt, with later text updates applied.
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

export async function captureEven(browser, url, device, { settleMs = 2500 } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.addInitScript(hostStub);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(settleMs);
    const calls = await page.evaluate(() => window.__osgCalls ?? []);
    return {
      viewport: device.display.viewport.value,
      title: await page.title(),
      methods: [...new Set(calls.map(c => c.method))],
      ...replay(calls),
    };
  } finally {
    await context.close();
  }
}
