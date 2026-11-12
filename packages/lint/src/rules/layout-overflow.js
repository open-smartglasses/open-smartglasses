const LAYOUT = 'https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/';

export default {
  id: 'layout/overflow',
  run({ page }) {
    const [width, height] = page.viewport;
    const findings = [];
    if (page.scrollWidth > width + 1) {
      findings.push({
        severity: 'error',
        basis: 'vendor',
        message: `Page is ${page.scrollWidth}px wide in a ${width}px viewport. Content is cut off sideways.`,
        source: LAYOUT,
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
