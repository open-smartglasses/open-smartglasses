#!/usr/bin/env node
// Keeps the documents in step with data/devices.
//   node scripts/facts.mjs          rewrite the generated tables, then check the claims
//   node scripts/facts.mjs --check  change nothing; exit 1 if anything is out of step
import { readFileSync } from 'node:fs';
import { devices, records, strongest, compareVersions, readText, writeText, root } from './lib.mjs';
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

// Compatibility records.
const watch = JSON.parse(readFileSync(`${root}/data/watch.json`, 'utf8'));
const allRecords = records();
const kinds = { contradiction: 'Docs disagree', undocumented: 'Undocumented', 'documented-limit': 'Documented, easy to miss', question: 'Open question' };
const versionNames = { sdk: 'SDK', cli: 'CLI', simulator: 'simulator', app: 'app', firmware: 'firmware', os: '', browser: '', toolkit: 'toolkit' };
const seenWith = versions =>
  Object.entries(versions ?? {})
    .map(([k, v]) => (versionNames[k] ? `${versionNames[k]} ${v}` : v))
    .join(', ');
const currentSdk = device => watch.sources.find(s => s.kind === 'sdk' && s.profiles.includes(device))?.seen;

function evidenceLabel(record) {
  if (record.kind === 'question') return '';
  const top = strongest(record);
  return [top ? top.level : 'none', record.disputed ? 'disputed' : ''].filter(Boolean).join(', ');
}

function status(record) {
  if (record.fixedIn) return `Fixed in ${seenWith(record.fixedIn.versions)}`;
  const sdk = currentSdk(record.device);
  const seen = (record.evidence ?? []).filter(e => e.result === 'reproduced' && e.versions?.sdk).map(e => e.versions.sdk);
  if (!sdk || !seen.length) return '';
  const newest = seen.sort(compareVersions).at(-1);
  return compareVersions(newest, sdk) < 0 ? `Recheck: last seen on SDK ${newest}, current ${sdk}` : '';
}

const forDevice = device => allRecords.filter(r => r.record.device === device).map(r => r.record);

function recordTable(device) {
  const rows = forDevice(device).map(record => {
    const top = strongest(record);
    return `| [${record.title}](./${device}/${record.id}.json) | ${kinds[record.kind]} | ${evidenceLabel(record)} | ${top && record.kind !== 'question' ? seenWith(top.versions) : ''} | ${status(record)} |`;
  });
  return ['| Record | Kind | Evidence | Seen with | Status |', '|---|---|---|---|---|', ...rows].join('\n');
}

// Open records an agent should know while writing code: no questions, nothing fixed.
function recordNotes(device) {
  return forDevice(device)
    .filter(r => r.kind !== 'question' && !r.fixedIn)
    .map(r => `- **${r.title}.** ${r.workaround ? `${r.workaround} ` : ''}([record](../../data/records/${device}/${r.id}.json), ${evidenceLabel(r)})`)
    .join('\n');
}

const generator = name => {
  if (tables[name]) return tables[name]();
  const [, what, device] = /^(records|notes)-(.+)$/.exec(name) ?? [];
  if (what === 'records') return recordTable(device);
  if (what === 'notes') return recordNotes(device);
  throw new Error(`no generator named "${name}"`);
};

const targets = ['data/README.md', 'skills/hud-design/SKILL.md', 'data/records/README.md', 'skills/platforms/even-g2.md', 'skills/platforms/mrbd.md'];
const block = /<!-- generated:([\w-]+) -->\n[\s\S]*?<!-- \/generated -->/g;
const problems = [];

for (const file of targets) {
  const { text, eol } = readText(file);
  let found = 0;
  const next = text.replace(block, (_, name) => {
    found++;
    return `<!-- generated:${name} -->\n${generator(name)}\n<!-- /generated -->`;
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
