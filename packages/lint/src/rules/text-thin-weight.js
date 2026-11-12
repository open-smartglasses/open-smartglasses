export default {
  id: 'text/thin-weight',
  run({ page }) {
    const thin = page.texts.filter(t => t.weight < 400);
    if (!thin.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${thin.length} text node(s) use a font weight below 400. Thin strokes break up on additive displays.`,
        source: 'https://developer.android.com/design/ui/ai-glasses/guides/styles/type',
        grade: 'docs',
        nodes: thin.map(n => ({ selector: n.selector, text: n.text, weight: n.weight })),
      },
    ];
  },
};
