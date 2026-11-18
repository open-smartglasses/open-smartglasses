import { GOOGLE_TYPE } from '../sources.js';

const MIN_DEG = 0.6;

const bySize = nodes =>
  [...nodes].sort((a, b) => a.px - b.px).map(n => ({ selector: n.selector, text: n.text, px: n.px }));

export default {
  id: 'text/min-size',
  run({ page, device }) {
    const findings = [];
    const floor = device.text?.minInteractivePx;
    const ppd = device.display.ppd;
    const reported = new Set();

    if (floor?.value) {
      const small = page.texts.filter(t => t.interactive && t.px < floor.value);
      if (small.length) {
        small.forEach(t => reported.add(t));
        findings.push({
          severity: 'error',
          basis: 'vendor',
          message: `${small.length} text node(s) in controls below the ${floor.value}px minimum for interactive elements on ${device.name}.`,
          source: floor.source,
          grade: floor.grade,
          nodes: bySize(small),
        });
      }
    }

    if (ppd?.value) {
      const limit = MIN_DEG * ppd.value;
      const small = page.texts.filter(t => !reported.has(t) && t.px < limit);
      if (small.length) {
        findings.push({
          severity: 'warn',
          basis: 'derived',
          message:
            `${small.length} text node(s) below ${MIN_DEG}° of visual angle ` +
            `(${limit.toFixed(1)}px at ${ppd.value} px/°).`,
          source: GOOGLE_TYPE,
          grade: ppd.grade,
          nodes: bySize(small),
        });
      }
    }
    return findings;
  },
};
