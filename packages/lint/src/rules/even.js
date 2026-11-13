import { SNAP_DESIGN } from '../sources.js';

const CHOICE_LIMIT = 7;
const label = c => ({ selector: `${c.kind} "${c.name || c.id}"`, text: c.content ?? '' });
const short = s => (s.length > 40 ? `${s.slice(0, 40)}…` : s);

// A finding backed by a fact in the device profile.
const vendor = (fact, message, nodes) => ({
  severity: 'error',
  basis: 'vendor',
  message,
  source: fact.source,
  grade: fact.grade,
  ...(nodes ? { nodes } : {}),
});

export const noPage = {
  id: 'page/none',
  run({ page }) {
    if (page.containers) return [];
    return [
      {
        severity: 'warn',
        basis: 'project',
        message: page.methods.length
          ? 'The app called the host but created no page while loading. Nothing was checked.'
          : 'The app made no Even Hub calls while loading. Nothing was checked.',
      },
    ];
  },
};

export const containerCount = {
  id: 'container/count',
  run({ page, device }) {
    const findings = [];
    const images = page.containers.filter(c => c.kind === 'image');
    const others = page.containers.filter(c => c.kind !== 'image');
    const { imageContainers, otherContainers } = device.limits;
    if (images.length > imageContainers.value) {
      findings.push(vendor(imageContainers, `${images.length} image containers. A page holds ${imageContainers.value} at most.`));
    }
    if (others.length > otherContainers.value) {
      findings.push(
        vendor(otherContainers, `${others.length} text and list containers. A page holds ${otherContainers.value} at most.`),
      );
    }
    return findings;
  },
};

export const containerBounds = {
  id: 'container/bounds',
  run({ page, device }) {
    const fact = device.display.viewport;
    const [width, height] = fact.value;
    const out = page.containers.filter(c => c.x < 0 || c.y < 0 || c.x + c.width > width || c.y + c.height > height);
    if (!out.length) return [];
    return [
      vendor(
        fact,
        `${out.length} container(s) reach outside the ${width}x${height} display.`,
        out.map(c => ({ selector: `${c.kind} "${c.name || c.id}"`, text: `${c.x},${c.y} ${c.width}x${c.height}` })),
      ),
    ];
  },
};

export const imageSize = {
  id: 'container/image-size',
  run({ page, device }) {
    const fact = device.limits.imageSize;
    const [width, height] = fact.value;
    const big = page.containers.filter(c => c.kind === 'image' && (c.width > width || c.height > height));
    if (!big.length) return [];
    return [
      vendor(
        fact,
        `${big.length} image container(s) larger than ${width}x${height}.`,
        big.map(c => ({ selector: `image "${c.name || c.id}"`, text: `${c.width}x${c.height}` })),
      ),
    ];
  },
};

export const containerName = {
  id: 'container/name',
  run({ page, device }) {
    const fact = device.limits.containerNameChars;
    const long = page.containers.filter(c => c.name.length > fact.value);
    if (!long.length) return [];
    return [vendor(fact, `${long.length} container name(s) longer than ${fact.value} characters.`, long.map(label))];
  },
};

export const eventCapture = {
  id: 'input/event-capture',
  run({ page, device }) {
    const fact = device.input.eventContainers;
    const capturing = page.containers.filter(c => c.eventCapture);
    if (capturing.length === fact.value) return [];
    return [
      vendor(
        fact,
        capturing.length
          ? `${capturing.length} containers capture events. Exactly one must.`
          : 'No container captures events, so the app receives no gestures.',
        capturing.map(label),
      ),
    ];
  },
};

export const listLength = {
  id: 'list/length',
  run({ page, device }) {
    const findings = [];
    const { listItems, listItemChars } = device.limits;
    for (const list of page.containers.filter(c => c.kind === 'list')) {
      if (list.items.length > listItems.value) {
        findings.push(
          vendor(listItems, `List "${list.name}" has ${list.items.length} items. A list holds ${listItems.value} at most.`),
        );
      }
      const long = list.items.filter(item => item.length > listItemChars.value);
      if (long.length) {
        findings.push(
          vendor(
            listItemChars,
            `${long.length} item(s) in list "${list.name}" are longer than ${listItemChars.value} characters.`,
            long.map(item => ({ selector: `${item.length} characters`, text: short(item) })),
          ),
        );
      }
    }
    return findings;
  },
};

export const textLength = {
  id: 'text/length',
  run({ page, device }) {
    const findings = [];
    const { textChars, textUpgradeChars } = device.limits;
    const created = page.containers.filter(c => c.kind === 'text' && c.createdChars > textChars.value);
    if (created.length) {
      findings.push(
        vendor(
          textChars,
          `${created.length} text container(s) created with more than ${textChars.value} characters.`,
          created.map(c => ({ selector: `text "${c.name || c.id}"`, text: `${c.createdChars} characters` })),
        ),
      );
    }
    const updates = page.updates.filter(u => u.content.length > textUpgradeChars.value);
    if (updates.length) {
      findings.push(
        vendor(
          textUpgradeChars,
          `${updates.length} text update(s) longer than ${textUpgradeChars.value} characters.`,
          updates.map(u => ({ selector: `text "${u.name || u.id}"`, text: `${u.content.length} characters` })),
        ),
      );
    }
    return findings;
  },
};

export const manyChoices = {
  id: 'input/many-choices',
  run({ page }) {
    return page.containers
      .filter(c => c.kind === 'list' && c.items.length > CHOICE_LIMIT)
      .map(list => ({
        severity: 'info',
        basis: 'derived',
        message: `List "${list.name}" has ${list.items.length} items. Each one is a swipe away; ${CHOICE_LIMIT} or fewer is easier to move through.`,
        source: SNAP_DESIGN,
        grade: 'docs',
      }));
  },
};

// The rules after the first need a page.
const needsPage = rule => ({ id: rule.id, run: ctx => (ctx.page.containers ? rule.run(ctx) : []) });

export default [
  noPage,
  ...[containerCount, containerBounds, imageSize, containerName, eventCapture, listLength, textLength, manyChoices].map(needsPage),
];
