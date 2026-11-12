import { GOOGLE_TYPE, GOOGLE_COLOR } from '../sources.js';

const pick = n => ({ selector: n.selector, text: n.text, px: n.px });

export const thinWeight = {
  id: 'text/thin-weight',
  run({ page }) {
    const thin = page.texts.filter(t => t.weight < 400);
    if (!thin.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${thin.length} text node(s) use a font weight below 400. Thin strokes break up on additive displays.`,
        source: GOOGLE_TYPE,
        grade: 'docs',
        nodes: thin.map(n => ({ selector: n.selector, text: n.text, weight: n.weight })),
      },
    ];
  },
};

export const condensed = {
  id: 'text/condensed',
  run({ page }) {
    const narrow = page.texts.filter(t => t.stretch < 100);
    if (!narrow.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${narrow.length} text node(s) use a condensed font width. Letters run together on glasses.`,
        source: GOOGLE_TYPE,
        grade: 'docs',
        nodes: narrow.map(pick),
      },
    ];
  },
};

export const darkOnLight = {
  id: 'text/dark-on-light',
  run({ page }) {
    // Unknown surfaces (images, gradients) are skipped rather than guessed.
    const dark = page.texts.filter(
      t => t.luminance != null && t.surfaceLuminance != null && t.surfaceLuminance > 0.3 && t.luminance < t.surfaceLuminance,
    );
    if (!dark.length) return [];
    return [
      {
        severity: 'info',
        basis: 'vendor',
        message:
          `${dark.length} text node(s) are dark on a light surface. ` +
          'Dark pixels are see-through on an additive display, so use light text on a dark surface.',
        source: GOOGLE_COLOR,
        grade: 'docs',
        nodes: dark.map(pick),
      },
    ];
  },
};
