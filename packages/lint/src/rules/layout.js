import { META_LAYOUT } from '../sources.js';

export const overflow = {
  id: 'layout/overflow',
  run({ page }) {
    const [width, height] = page.viewport;
    const findings = [];
    if (page.scrollWidth > width + 1) {
      findings.push({
        severity: 'error',
        basis: 'vendor',
        message: `Page is ${page.scrollWidth}px wide in a ${width}px viewport. Content is cut off sideways.`,
        source: META_LAYOUT,
        grade: 'docs',
      });
    }
    if (page.scrollHeight > height * 2) {
      findings.push({
        severity: 'info',
        basis: 'project',
        message: `Page is ${(page.scrollHeight / height).toFixed(1)} screens tall. Long scrolling is slow with gesture input.`,
      });
    }
    return findings;
  },
};

export const viewportMeta = {
  id: 'layout/viewport-meta',
  run({ page }) {
    const content = page.viewportMeta;
    const base = { basis: 'vendor', source: META_LAYOUT, grade: 'docs' };
    const wanted = '<meta name="viewport" content="width=device-width, initial-scale=1">';
    if (!content) {
      return [{ ...base, severity: 'error', message: `Missing ${wanted}.` }];
    }
    const findings = [];
    const fixed = /width\s*=\s*(\d+)/.exec(content);
    if (fixed) {
      findings.push({
        ...base,
        severity: 'warn',
        message: `Viewport meta fixes the width at ${fixed[1]}px. Use width=device-width and lay out from the real viewport.`,
      });
    } else if (!/width\s*=\s*device-width/.test(content)) {
      findings.push({ ...base, severity: 'error', message: `Viewport meta has no width. Use ${wanted}.` });
    }
    if (/user-scalable\s*=\s*(no|0)/.test(content)) {
      findings.push({ ...base, severity: 'warn', message: 'Viewport meta sets user-scalable=no. Leave it out.' });
    }
    return findings;
  },
};

export const nestedScroll = {
  id: 'layout/nested-scroll',
  run({ page }) {
    if (!page.nestedScroll.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${page.nestedScroll.length} scroll area(s) sit inside another one on the same axis. Keep one scroll owner per axis.`,
        source: META_LAYOUT,
        grade: 'docs',
        nodes: page.nestedScroll,
      },
    ];
  },
};
