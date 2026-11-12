import { META_LAYOUT, META_AGENTS } from '../sources.js';

const BRIGHT_LIMIT = 0.3;
const BACKGROUND_LIMIT = 0.1;

export const background = {
  id: 'display/background',
  run({ page }) {
    const { edgeLuma } = page.pixels;
    if (edgeLuma <= BACKGROUND_LIMIT) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: 'The page background is lit. Black is transparent on an additive display; keep the background black.',
        source: META_LAYOUT,
        grade: 'docs',
      },
    ];
  },
};

export const brightFill = {
  id: 'display/bright-fill',
  run({ page }) {
    const { brightRatio } = page.pixels;
    if (brightRatio <= BRIGHT_LIMIT) return [];
    return [
      {
        severity: 'warn',
        basis: 'project',
        message:
          `${Math.round(brightRatio * 100)}% of the screen is bright. ` +
          'On an additive display a bright fill hides the world behind it.',
        source: META_LAYOUT,
        grade: 'docs',
      },
    ];
  },
};

export const imageAlt = {
  id: 'display/image-alt',
  run({ page }) {
    if (!page.imagesWithoutAlt.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${page.imagesWithoutAlt.length} image(s) have no alt attribute.`,
        source: META_AGENTS,
        grade: 'docs',
        nodes: page.imagesWithoutAlt,
      },
    ];
  },
};
