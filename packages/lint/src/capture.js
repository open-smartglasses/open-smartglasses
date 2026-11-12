import { PNG } from 'pngjs';

// Runs inside the page. Returns what the rules need from the DOM of the current screen.
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

  const parseColor = value => {
    const m = /rgba?\(([^)]+)\)/.exec(value);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const luminance = ({ r, g, b }) => {
    const lin = c => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };

  // Luminance of the nearest solid background behind an element.
  // null when it cannot be known from styles (image or gradient, or nothing drawn).
  const surfaceLuminance = el => {
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') return null;
      const color = parseColor(style.backgroundColor);
      if (color && color.a >= 0.5) return luminance(color);
    }
    return null;
  };

  const isShown = el => {
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  };

  // Text
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

    const color = parseColor(style.color);
    texts.push({
      text: text.slice(0, 40),
      chars: text.length,
      px: Math.round(parseFloat(style.fontSize) * scale * 10) / 10,
      weight: Number(style.fontWeight) || 400,
      stretch: parseFloat(style.fontStretch) || 100,
      luminance: color ? luminance(color) : null,
      surfaceLuminance: surfaceLuminance(el),
      selector: describe(el),
    });
  }

  // Controls the wearer can move focus to
  const focusable = 'a[href], button, input:not([type=hidden]), select, textarea, [tabindex], [role=button], [role=link]';
  const nameOf = el =>
    (
      el.getAttribute('aria-label') ||
      (el.getAttribute('aria-labelledby') &&
        document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) ||
      el.innerText ||
      el.querySelector?.('img[alt]')?.alt ||
      el.getAttribute('title') ||
      el.value ||
      el.getAttribute('placeholder') ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim();
  const controls = [...document.querySelectorAll(focusable)]
    .filter(el => !el.disabled && el.tabIndex >= 0 && isShown(el))
    .map(el => ({
      selector: describe(el),
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      name: nameOf(el).slice(0, 40),
      tabindex: el.tabIndex,
    }));

  // Scroll containers nested inside another scroll container on the same axis
  const scrolls = el => {
    const style = getComputedStyle(el);
    return {
      y: /auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1,
      x: /auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1,
    };
  };
  const nestedScroll = [];
  for (const el of document.body.querySelectorAll('*')) {
    const own = scrolls(el);
    if (!own.x && !own.y) continue;
    for (let up = el.parentElement; up && up !== document.documentElement; up = up.parentElement) {
      if (up === document.body) break;
      const outer = scrolls(up);
      if ((own.y && outer.y) || (own.x && outer.x)) {
        nestedScroll.push({ selector: describe(el), text: `inside ${describe(up)}` });
        break;
      }
    }
  }

  const root = document.documentElement;
  return {
    texts,
    controls,
    nestedScroll,
    imagesWithoutAlt: [...document.images]
      .filter(img => !img.hasAttribute('alt') && isShown(img))
      .map(img => ({ selector: describe(img), text: (img.currentSrc || img.src).split('/').pop().slice(0, 40) })),
    viewportMeta: document.querySelector('meta[name=viewport]')?.content ?? null,
    scrollWidth: root.scrollWidth,
    scrollHeight: root.scrollHeight,
    title: document.title,
  };
}

function pixelStats(buffer) {
  const png = PNG.sync.read(buffer);
  const { width, height, data } = png;
  const lumaAt = i => (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;

  const total = width * height;
  let lit = 0;
  let bright = 0;
  for (let i = 0; i < total; i++) {
    const luma = lumaAt(i);
    if (luma > 0.08) lit++;
    if (luma > 0.6) bright++;
  }

  // The outer ring of pixels stands in for the page background.
  const edge = [];
  for (let x = 0; x < width; x++) edge.push(lumaAt(x), lumaAt((height - 1) * width + x));
  for (let y = 0; y < height; y++) edge.push(lumaAt(y * width), lumaAt(y * width + width - 1));
  edge.sort((a, b) => a - b);

  return { litRatio: lit / total, brightRatio: bright / total, edgeLuma: edge[Math.floor(edge.length / 2)] };
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
