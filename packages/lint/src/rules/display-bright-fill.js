const LAYOUT = 'https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/';
const LIMIT = 0.3;

export default {
  id: 'display/bright-fill',
  run({ page }) {
    const { brightRatio } = page.pixels;
    if (brightRatio <= LIMIT) return [];
    return [
      {
        severity: 'warn',
        basis: 'project',
        message:
          `${Math.round(brightRatio * 100)}% of the screen is bright. ` +
          'On an additive display a bright fill hides the world behind it.',
        source: LAYOUT,
        grade: 'docs',
      },
    ];
  },
};
