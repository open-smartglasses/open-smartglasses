#!/usr/bin/env node
// Keeps the documents in step with data/devices.
//   node scripts/facts.mjs          rewrite the generated tables, then check the claims
//   node scripts/facts.mjs --check  change nothing; exit 1 if anything is out of step
import { devices, readText, writeText } from './lib.mjs';
import { claims } from './claims.mjs';
import { rules } from '../packages/lint/src/index.js';

const check = process.argv.includes('--check');
const all = devices();
const order = ['mrbd', 'even-g2', 'android-xr'];
const list = [...order.filter(id => all[id]), ...Object.keys(all).filter(id => !order.includes(id))].map(id => all[id]);

const runtimes = { web: 'Web Apps', 'even-hub': 'Even Hub', 'compose-glimmer': 'Jetpack Compose Glimmer' };
const colors = { 'additive-color': 'Additive, full color', 'monochrome-green': 'Green only' };

function screen(d) {
  const v = d.display.viewport.value;
  return v ? v.join('×') : 'Not published';
}

function color(d) {
  const levels = d.display.levels?.value;
  return colors[d.display.color.value] + (levels ? `, ${levels} levels` : '');
}

function input(d) {
  const events = d.input?.events?.value;
  if (events) return `Keys: ${events.map(e => e.replace(/^Arrow/, '')).join(', ')}`;
  return d.input.gestures.value.map(g => g.replace(/-/g, ' ')).join(', ');
}

const tables = {
  profiles: () =>
    [
      '| Profile | Device | Runtime | Lint |',
      '|---|---|---|---|',
      ...list.map(d => `| [\`${d.id}\`](./devices/${d.id}.json) | ${d.name} | ${runtimes[d.runtime]} | ${rules[d.runtime] ? 'Yes' : 'No'} |`),
    ].join('\n'),
  devices: () =>
    [
      '| Device | Screen | Pixels per degree | Color | Input |',
      '|---|---|---|---|---|',
      ...list.map(d => `| ${d.name} (\`${d.id}\`) | ${screen(d)} | ${d.display.ppd.value ?? 'Not published'} | ${color(d)} | ${input(d)} |`),
    ].join('\n'),
};

const targets = ['data/README.md', 'skills/hud-design/SKILL.md'];
const block = /<!-- generated:(\w+) -->\n[\s\S]*?<!-- \/generated -->/g;
const problems = [];

for (const file of targets) {
  const { text, eol } = readText(file);
  let found = 0;
  const next = text.replace(block, (_, name) => {
    found++;
    if (!tables[name]) throw new Error(`${file}: no generator named "${name}"`);
    return `<!-- generated:${name} -->\n${tables[name]()}\n<!-- /generated -->`;
  });
  if (!found) problems.push(`${file}: no generated block found`);
  if (next === text) continue;
  if (check) problems.push(`${file}: generated table is out of date. Run "npm run facts".`);
  else {
    writeText(file, next, eol);
    console.log(`updated ${file}`);
  }
}

for (const claim of claims(all)) {
  if (claim.when === false) continue;
  const { text } = readText(claim.file);
  const match = text.match(claim.pattern);
  if (!match) {
    problems.push(`${claim.file}: expected text not found: ${claim.pattern}`);
    continue;
  }
  claim.values.forEach((value, i) => {
    if (match[i + 1] !== String(value)) {
      problems.push(`${claim.file}: says "${match[i + 1]}", the profile gives "${value}" in "${match[0]}"`);
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Documents match the device profiles.');
