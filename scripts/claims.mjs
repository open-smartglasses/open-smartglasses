// Numbers that prose repeats from the device profiles.
// Each claim is a file, a pattern with one capture group per value, and the values the profiles give.
// `npm run check` fails when the text and the profiles disagree, or when the pattern is gone.

const px = (device, degrees) => Math.round(degrees * device.display.ppd.value);
const size = fact => fact.value.join('×');
const thousands = n => n.toLocaleString('en-US');

export function claims({ mrbd, 'even-g2': even, 'android-xr': axr }) {
  const minDegrees = axr.text.minDegrees.value;
  const minPx = px(mrbd, minDegrees);
  const limits = even.limits;

  return [
    // Agent block
    { file: 'skills/AGENTS.md', pattern: /at least ([\d.]+)° of visual angle \((\d+)px on Meta/, values: [minDegrees, minPx] },
    { file: 'skills/AGENTS.md', pattern: /vendor minimum \((\d+)px there\)/, values: [mrbd.text.minPx.value] },

    // hud-design
    { file: 'skills/hud-design/SKILL.md', pattern: /Minimum size is ([\d.]+)° .*: (\d+)px on Meta Ray-Ban Display, (\d+)sp on Android XR/, values: [minDegrees, minPx, axr.text.minSp.value] },
    { file: 'skills/hud-design/SKILL.md', pattern: /0\.7° to 0\.9°: (\d+) to (\d+)px/, values: [px(mrbd, 0.7), px(mrbd, 0.9)] },
    { file: 'skills/hud-design/SKILL.md', pattern: /vendor minimum: (\d+)px on Meta/, values: [mrbd.text.minPx.value] },
    { file: 'skills/hud-design/SKILL.md', pattern: /a list item holds (\d+)\./, values: [limits.listItemChars.value] },
    { file: 'skills/hud-design/SKILL.md', pattern: /Keep history to (\d+) entries/, values: [mrbd.limits.historyEntries.value] },
    { file: 'skills/hud-design/SKILL.md', pattern: /only (\w+) container per page receives events, and a page holds (\d+) image containers and (\d+) others/, values: ['one', limits.imageContainers.value, limits.otherContainers.value], when: even.input.eventContainers.value === 1 },

    // hud-review
    { file: 'skills/hud-review/SKILL.md', pattern: /(\d+) image containers and (\d+) others at most, lists of (\d+) items and (\d+) characters/, values: [limits.imageContainers.value, limits.otherContainers.value, limits.listItems.value, limits.listItemChars.value] },
    { file: 'skills/hud-review/SKILL.md', pattern: /History stays within (\d+) entries/, values: [mrbd.limits.historyEntries.value] },

    // Platform notes
    { file: 'skills/platforms/mrbd.md', pattern: /Test at (\d+×\d+), device pixel ratio (\d+)/, values: [size(mrbd.display.viewport), mrbd.display.devicePixelRatio.value] },
    { file: 'skills/platforms/mrbd.md', pattern: /About (\d+) pixels per degree, a (\w+) figure\. ([\d.]+)° is (\d+)px/, values: [mrbd.display.ppd.value, mrbd.display.ppd.grade, minDegrees, minPx] },
    { file: 'skills/platforms/mrbd.md', pattern: /Text never below (\d+)px/, values: [mrbd.text.minPx.value] },
    { file: 'skills/platforms/mrbd.md', pattern: /History holds (\d+) entries/, values: [mrbd.limits.historyEntries.value] },
    { file: 'skills/platforms/mrbd.md', pattern: /renders the first screen at (\d+×\d+)/, values: [size(mrbd.display.viewport)] },
    { file: 'skills/platforms/even-g2.md', pattern: /- (\d+×\d+), green only, (\d+) brightness levels/, values: [size(even.display.viewport), even.display.levels.value] },
    { file: 'skills/platforms/even-g2.md', pattern: /holds (\d+) image containers and (\d+) text or list containers/, values: [limits.imageContainers.value, limits.otherContainers.value] },
    { file: 'skills/platforms/even-g2.md', pattern: /An image container is (\d+×\d+) at most/, values: [size(limits.imageSize)] },
    { file: 'skills/platforms/even-g2.md', pattern: /takes ([\d,]+) characters when a page is created or rebuilt, and ([\d,]+) in an update/, values: [thousands(limits.textChars.value), thousands(limits.textUpgradeChars.value)] },
    { file: 'skills/platforms/even-g2.md', pattern: /A list holds (\d+) items of (\d+) characters/, values: [limits.listItems.value, limits.listItemChars.value] },
    { file: 'skills/platforms/even-g2.md', pattern: /A container name is (\d+) characters at most/, values: [limits.containerNameChars.value] },

    // Guidelines
    { file: 'guidelines/README.md', pattern: /\| Meta Ray-Ban Display \| (\d+) \((\w+) figure\) \| (\d+)px \| (\d+)px \|/, values: [mrbd.display.ppd.value, mrbd.display.ppd.grade, minPx, px(mrbd, 0.8)] },
    { file: 'guidelines/text.md', pattern: /([\d.]+)° of visual angle\. On Meta Ray-Ban Display, never below (\d+)px/, values: [minDegrees, mrbd.text.minPx.value] },
    { file: 'guidelines/density.md', pattern: /\| Meta Ray-Ban Display \| (\d+×\d+) is the size to test at/, values: [size(mrbd.display.viewport)] },
    { file: 'guidelines/density.md', pattern: /\| Even G2 \| (\d+×\d+)\. A page holds at most (\d+) image containers and (\d+) others\. A list holds at most (\d+) items of (\d+) characters/, values: [size(even.display.viewport), limits.imageContainers.value, limits.otherContainers.value, limits.listItems.value, limits.listItemChars.value] },
  ];
}
