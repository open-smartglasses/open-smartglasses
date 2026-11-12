import { META_INPUT, META_PATTERNS, META_AGENTS, SNAP_DESIGN } from '../sources.js';

const pick = c => ({ selector: c.selector, text: c.name || `<${c.tag}>` });
const LIST_LIMIT = 7;

export const positiveTabindex = {
  id: 'input/positive-tabindex',
  run({ page }) {
    const hits = page.controls.filter(c => c.tabindex > 0);
    if (!hits.length) return [];
    return [
      {
        severity: 'error',
        basis: 'vendor',
        message: `${hits.length} element(s) use a positive tabindex. It fights the built-in directional navigation.`,
        source: META_INPUT,
        grade: 'docs',
        nodes: hits.map(pick),
      },
    ];
  },
};

export const inAppBack = {
  id: 'input/in-app-back',
  run({ page }) {
    const hits = page.controls.filter(c => /^(go )?(back|home|close|exit|←|‹|<)$/i.test(c.name));
    if (!hits.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${hits.length} Back, Home or Close control(s). The system gesture already does this.`,
        source: META_PATTERNS,
        grade: 'docs',
        nodes: hits.map(pick),
      },
    ];
  },
};

export const unnamedControl = {
  id: 'input/unnamed-control',
  run({ page }) {
    const hits = page.controls.filter(c => !c.name);
    if (!hits.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${hits.length} focusable control(s) have no accessible name.`,
        source: META_AGENTS,
        grade: 'docs',
        nodes: hits.map(pick),
      },
    ];
  },
};

export const textEntry = {
  id: 'input/text-entry',
  run({ page }) {
    const hits = page.controls.filter(c => c.tag === 'input' && ['password', 'date', 'datetime-local', 'time'].includes(c.type));
    if (!hits.length) return [];
    return [
      {
        severity: 'warn',
        basis: 'vendor',
        message: `${hits.length} password or date input(s). These are hard to fill in on glasses; move the step to the phone.`,
        source: META_INPUT,
        grade: 'docs',
        nodes: hits.map(c => ({ selector: c.selector, text: `type=${c.type}` })),
      },
    ];
  },
};

export const manyChoices = {
  id: 'input/many-choices',
  run({ page }) {
    const count = page.controls.length;
    if (count <= LIST_LIMIT) return [];
    return [
      {
        severity: 'info',
        basis: 'derived',
        message: `${count} focusable controls on one screen. Each one is a gesture away; ${LIST_LIMIT} or fewer is easier to move through.`,
        source: SNAP_DESIGN,
        grade: 'docs',
      },
    ];
  },
};
