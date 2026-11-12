import { PNG } from 'pngjs';

// Runs inside the page. Returns every visible text node in the viewport.
function collect() {
  const vw = innerWidth;
  const vh = innerHeight;

  const describe = el => {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 3; node = node.parentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${part}#${node.id}`);
        break;
      }
      const cls = [...node.classList].slice(0, 2).join('.');
      if (cls) part += `.${cls}`;
      parts.unshift(part);
    }
    return parts.join(' > ');
  };

  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) continue;

    // Ancestor transforms change the rendered size without changing font-size.
    const box = el.getBoundingClientRect();
    let scale = el.offsetWidth > 0 ? box.width / el.offsetWidth : 1;
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    texts.push({
      text: text.slice(0, 40),
      chars: text.length,
      px: Math.round(parseFloat(style.fontSize) * scale * 10) / 10,
      weight: Number(style.fontWeight) || 400,
      selector: describe(el),
    });
  }

  const root = document.documentElement;
  return {
    texts,
    scrollWidth: root.scrollWidth,
    scrollHeight: root.scrollHeight,
    title: document.title,
  };
}

function pixelStats(buffer) {
  const png = PNG.sync.read(buffer);
  const total = png.width * png.height;
  let lit = 0;
  let bright = 0;
  for (let i = 0; i < total; i++) {
    const luma =
      (0.2126 * png.data[i * 4] + 0.7152 * png.data[i * 4 + 1] + 0.0722 * png.data[i * 4 + 2]) / 255;
    if (luma > 0.08) lit++;
    if (luma > 0.6) bright++;
  }
  return { litRatio: lit / total, brightRatio: bright / total };
}

export async function capture(browser, url, device, { settleMs = 1500, screenshotPath } = {}) {
  const [width, height] = device.display.viewport.value;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: device.display.devicePixelRatio?.value ?? 1,
    colorScheme: 'dark',
  });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(settleMs);
    const screenshot = await page.screenshot({ type: 'png', path: screenshotPath });
    const dom = await page.evaluate(collect);
    return { ...dom, viewport: [width, height], pixels: pixelStats(screenshot) };
  } finally {
    await context.close();
  }
}
