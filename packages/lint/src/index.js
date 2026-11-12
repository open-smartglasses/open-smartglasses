import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { launch } from './browser.js';
import { capture } from './capture.js';
import { loadDevice, listDevices } from './devices.js';
import textMinSize from './rules/text-min-size.js';
import { thinWeight, condensed, darkOnLight } from './rules/text-shape.js';
import { overflow, viewportMeta, nestedScroll } from './rules/layout.js';
import { positiveTabindex, inAppBack, unnamedControl, textEntry, manyChoices } from './rules/input.js';
import { background, brightFill, imageAlt } from './rules/display.js';

export { loadDevice, listDevices };
export const rules = [
  textMinSize,
  thinWeight,
  condensed,
  darkOnLight,
  overflow,
  viewportMeta,
  nestedScroll,
  positiveTabindex,
  inAppBack,
  unnamedControl,
  textEntry,
  manyChoices,
  background,
  brightFill,
  imageAlt,
];

const round = n => Math.round(n * 1000) / 1000;

export function toUrl(target) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return target;
  const file = path.resolve(target);
  if (!existsSync(file)) throw new Error(`Not a URL or an existing file: ${target}`);
  return pathToFileURL(file).href;
}

// Pure: takes a captured page and a device profile, returns findings.
export function evaluate(page, device) {
  const findings = rules.flatMap(rule => rule.run({ page, device }).map(f => ({ rule: rule.id, ...f })));
  const count = severity => findings.filter(f => f.severity === severity).length;
  return {
    findings,
    summary: { errors: count('error'), warnings: count('warn'), notes: count('info') },
  };
}

export async function lint(target, { device: deviceId = 'mrbd', browser, screenshotPath } = {}) {
  const device = loadDevice(deviceId);
  const url = toUrl(target);
  const ownBrowser = browser ?? (await launch());
  try {
    const page = await capture(ownBrowser, url, device, { screenshotPath });
    const { findings, summary } = evaluate(page, device);
    return {
      url,
      device: device.id,
      viewport: page.viewport,
      summary,
      findings,
      metrics: {
        textNodes: page.texts.length,
        controls: page.controls.length,
        smallestTextPx: page.texts.length ? Math.min(...page.texts.map(t => t.px)) : null,
        litRatio: round(page.pixels.litRatio),
        brightRatio: round(page.pixels.brightRatio),
        scrollHeight: page.scrollHeight,
      },
    };
  } finally {
    if (!browser) await ownBrowser.close();
  }
}
