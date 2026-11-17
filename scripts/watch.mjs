#!/usr/bin/env node
// Looks for reasons to re-read the vendor sources behind the device profiles and the records.
//   node scripts/watch.mjs           print what needs a recheck
//   node scripts/watch.mjs --issues  also open a GitHub issue for each (needs gh and GH_TOKEN)
//   node scripts/watch.mjs --update  record what the sources show now as seen
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { root, devices, records, compareVersions } from './lib.mjs';
import { packageFile } from './probes/lib.mjs';

const file = path.join(root, 'data', 'watch.json');
const watch = JSON.parse(readFileSync(file, 'utf8'));
const args = new Set(process.argv.slice(2));
const headers = { 'user-agent': 'open-smartglasses-watch' };

async function get(url, as = 'json') {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const auth = token && url.startsWith('https://api.github.com/') ? { authorization: `Bearer ${token}` } : {};
  const response = await fetch(url, { headers: { ...headers, ...auth } });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return as === 'json' ? response.json() : response.text();
}

// Names a TypeScript declaration file exports.
const exportsOf = dts =>
  [...dts.matchAll(/export\s*\{([^}]*)\}/g)]
    .flatMap(m => m[1].split(','))
    .map(s => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop())
    .filter(Boolean);

// What one SDK release exposes: declared exports, changelog, host floor and the build itself.
async function sdkSurface(pkg, version) {
  const [dts, readme, manifest, js] = await Promise.all(
    ['dist/index.d.ts', 'README.md', 'package.json', 'dist/index.js'].map(f => packageFile(pkg, version, f)),
  );
  const changelog = {};
  for (const [, v, text] of readme.matchAll(/^###\s+(\d+\.\d+\.\d+)\s*\n([\s\S]*?)(?=^##)/gm)) changelog[v] = text.trim();
  return {
    exports: exportsOf(dts),
    changelog,
    minAppVersion: JSON.parse(manifest).minAppVersion,
    js: { bytes: Buffer.byteLength(js), sha256: createHash('sha256').update(js).digest('hex') },
  };
}

// What changed in the SDK between two releases, and the records last seen before the new one.
async function sdkReport(source, version) {
  const [before, after] = await Promise.all([sdkSurface(source.package, source.seen), sdkSurface(source.package, version)]);
  const added = after.exports.filter(e => !before.exports.includes(e));
  const removed = before.exports.filter(e => !after.exports.includes(e));
  const lines = [
    `- Declared exports: ${added.length || removed.length ? `added ${added.join(', ') || 'none'}; removed ${removed.join(', ') || 'none'}` : 'unchanged'}.`,
    `- Build: dist/index.js ${before.js.bytes} → ${after.js.bytes} bytes, ${before.js.sha256 === after.js.sha256 ? 'identical' : 'changed'}. Identical types do not mean identical behaviour.`,
    `- minAppVersion: ${before.minAppVersion} → ${after.minAppVersion}.`,
  ];
  const notes = Object.entries(after.changelog).filter(([v]) => compareVersions(v, source.seen) > 0);
  if (notes.length) lines.push('', 'Changelog:', '', ...notes.flatMap(([v, text]) => [`### ${v}`, '', text, '']));
  const stale = records()
    .filter(({ record }) => source.profiles.includes(record.device))
    .filter(({ record }) => record.evidence.some(e => e.versions?.sdk && e.result === 'reproduced'));
  if (stale.length) {
    lines.push('', 'Records seen on an earlier SDK. Rerun their probes where they have one:', '');
    const probe = record => (record.repro?.startsWith('scripts/') ? `: \`${record.repro}\`` : '');
    lines.push(...stale.map(({ path: p, record }) => `- [${record.title}](../blob/main/${p})${probe(record)}`));
  }
  return lines.join('\n');
}

// Names each vendor skill imports from a package that the package does not export.
async function missingImports(source, version) {
  const tree = await get(`https://api.github.com/repos/${source.repo}/git/trees/HEAD?recursive=1`);
  const skills = tree.tree.filter(e => e.path.startsWith(`${source.path}/`) && e.path.endsWith('.md'));
  const exported = new Set(exportsOf(await packageFile(source.package, version, 'dist/index.d.ts')));
  const pattern = new RegExp(`import\\s*(?:type\\s*)?\\{([^}]*)\\}\\s*from\\s*['"]${source.package.replace('/', '\\/')}['"]`, 'g');
  const missing = {};
  for (const entry of skills) {
    const text = await get(`https://raw.githubusercontent.com/${source.repo}/HEAD/${entry.path}`, 'text');
    const names = [...text.matchAll(pattern)].flatMap(m => m[1].split(',')).map(s => s.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, ''));
    const absent = [...new Set(names.filter(n => n && !exported.has(n)))].sort();
    if (absent.length) missing[entry.path.slice(source.path.length + 1)] = absent;
  }
  return missing;
}

const latestNpm = async pkg => (await get(`https://registry.npmjs.org/${pkg}/latest`)).version;

// Each type returns what the source shows now, how to name it, and, when it differs from
// what was seen, what to say about it.
const current = {
  async npm(source) {
    const version = await latestNpm(source.package);
    const report = source.kind === 'sdk' && version !== source.seen ? await sdkReport(source, version) : '';
    return { seen: version, label: `${source.package} ${version}`, url: `https://www.npmjs.com/package/${source.package}`, report };
  },
  async github(source) {
    const query = source.path ? `&path=${encodeURIComponent(source.path)}` : '';
    const [commit] = await get(`https://api.github.com/repos/${source.repo}/commits?per_page=1${query}`);
    const what = source.path ? `${source.repo}/${source.path}` : source.repo;
    return { seen: commit.sha, label: `${what} at ${commit.sha.slice(0, 7)}`, url: commit.html_url };
  },
  async page(source) {
    const html = await get(source.url, 'text');
    const match = html.match(new RegExp(source.pattern));
    if (!match) throw new Error(`${source.url}: "${source.pattern}" not found`);
    return { seen: match[1], label: `${source.url} updated ${match[1]}`, url: source.url };
  },
  async imports(source) {
    const version = await latestNpm(source.package);
    const missing = await missingImports(source, version);
    const describe = m => Object.entries(m).map(([skill, names]) => `- \`${skill}\`: ${names.join(', ')}`).join('\n') || '- none';
    return {
      seen: missing,
      label: `${source.repo} skills against ${source.package} ${version}`,
      url: `https://github.com/${source.repo}/tree/HEAD/${source.path}`,
      report: `Names the skills import that the package does not export.\n\nNow:\n\n${describe(missing)}\n\nBefore:\n\n${describe(source.seen)}`,
    };
  },
  async probe(source) {
    const version = await latestNpm(source.package);
    const out = execFileSync(process.execPath, [path.join(root, source.script), '--sdk', version, '--json'], { encoding: 'utf8' });
    const result = JSON.parse(out)[source.field];
    return {
      seen: result,
      label: `${path.basename(source.script)} on ${source.package} ${version}: ${source.field} ${result}`,
      url: `https://www.npmjs.com/package/${source.package}`,
      report: `The probe gave \`${source.field}: ${result}\`, against \`${source.seen}\` before.`,
    };
  },
};

async function main() {
  const rechecks = [];

  for (const source of watch.sources) {
    const now = await current[source.type](source);
    if (isDeepStrictEqual(now.seen, source.seen)) continue;
    if (args.has('--update')) {
      source.seen = now.seen;
      continue;
    }
    rechecks.push({
      title: `Recheck: ${now.label}`,
      body: [
        now.url,
        '',
        source.why,
        ...(now.report ? ['', now.report] : []),
        '',
        `When done, run \`node scripts/watch.mjs --update\` and \`npm run facts\`.`,
      ].join('\n'),
    });
  }

  if (args.has('--update')) {
    writeFileSync(file, JSON.stringify(watch, null, 2) + '\n');
    console.log('Recorded what the sources show now.');
    return;
  }

  // Facts nobody has re-read for a while.
  const cutoff = new Date(Date.now() - watch.staleDays * 86400000).toISOString().slice(0, 10);
  for (const device of Object.values(devices())) {
    const stale = [];
    for (const [group, facts] of Object.entries(device)) {
      if (typeof facts !== 'object') continue;
      for (const [name, fact] of Object.entries(facts)) {
        if (fact.grade !== 'unknown' && fact.checked < cutoff) stale.push(`- \`${group}.${name}\`, checked ${fact.checked}: ${fact.source}`);
      }
    }
    if (stale.length) {
      rechecks.push({
        title: `Recheck ${device.id}: facts older than ${watch.staleDays} days`,
        open: true,
        body: [`These facts in \`data/devices/${device.id}.json\` were last checked before ${cutoff}.`, '', ...stale].join('\n'),
      });
    }
  }

  if (!rechecks.length) {
    console.log('Nothing to recheck.');
    return;
  }

  for (const recheck of rechecks) {
    console.log(recheck.title);
    if (args.has('--verbose')) console.log(`${recheck.body}\n`);
    if (!args.has('--issues')) continue;
    // A change is reported once. A stale-facts issue is opened again once the last one is closed.
    const state = recheck.open ? 'open' : 'all';
    const existing = JSON.parse(execFileSync('gh', ['issue', 'list', '--state', state, '--search', `in:title "${recheck.title}"`, '--json', 'title'], { encoding: 'utf8' }));
    if (existing.some(issue => issue.title === recheck.title)) continue;
    execFileSync('gh', ['issue', 'create', '--title', recheck.title, '--body', recheck.body], { stdio: 'inherit' });
  }
}

await main();
