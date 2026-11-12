import { GOOGLE_TYPE } from '../sources.js';

const MIN_DEG = 0.6;

const bySize = nodes =>
  [...nodes].sort((a, b) => a.px - b.px).map(n => ({ selector: n.selector, text: n.text, px: n.px }));

export default {
  id: 'text/min-size',
  run({ page, device }) {
    const findings = [];
    const floor = device.text?.minPx;
    const ppd = device.display.ppd;

    if (floor?.value) {
      const small = page.texts.filter(t => t.px < floor.value);
      if (small.length) {
        findings.push({
          severity: 'error',
          basis: 'vendor',
          message: `${small.length} text node(s) below the ${floor.value}px minimum for ${device.name}.`,
          source: floor.source,
          grade: floor.grade,
          nodes: bySize(small),
        });
      }
    }

    if (ppd?.value) {
      const limit = MIN_DEG * ppd.value;
      const from = floor?.value ?? 0;
      const small = page.texts.filter(t => t.px >= from && t.px < limit);
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
