#!/usr/bin/env node
// Looks for reasons to re-read the vendor sources behind the device profiles.
//   node scripts/watch.mjs           print what needs a recheck
//   node scripts/watch.mjs --issues  also open a GitHub issue for each (needs gh and GH_TOKEN)
//   node scripts/watch.mjs --update  record the current vendor versions as seen
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { root, devices } from './lib.mjs';

const file = path.join(root, 'data', 'watch.json');
const watch = JSON.parse(readFileSync(file, 'utf8'));
const args = new Set(process.argv.slice(2));

async function json(url) {
  const headers = { 'user-agent': 'open-smartglasses-watch' };
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token && url.startsWith('https://api.github.com/')) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

const current = {
  async npm(source) {
    const latest = await json(`https://registry.npmjs.org/${source.package}/latest`);
    return { version: latest.version, label: `${source.package} ${latest.version}`, url: `https://www.npmjs.com/package/${source.package}` };
  },
  async github(source) {
    const query = source.path ? `&path=${encodeURIComponent(source.path)}` : '';
    const [commit] = await json(`https://api.github.com/repos/${source.repo}/commits?per_page=1${query}`);
    const what = source.path ? `${source.repo}/${source.path}` : source.repo;
    return { version: commit.sha, label: `${what} at ${commit.sha.slice(0, 7)}`, url: commit.html_url };
  },
};

async function main() {
  const rechecks = [];

  for (const source of watch.sources) {
    const now = await current[source.type](source);
    if (now.version === source.seen) continue;
    if (args.has('--update')) {
      source.seen = now.version;
      continue;
    }
    rechecks.push({
      title: `Recheck ${source.profiles.join(', ')}: ${now.label}`,
      body: [
        `${now.url}`,
        '',
        `Last checked against \`${source.seen}\`.`,
        '',
        `Re-read the source and compare it with ${source.profiles.map(p => `\`data/devices/${p}.json\``).join(', ')}. Update the facts and their \`checked\` dates, then run \`node scripts/watch.mjs --update\` and \`npm run facts\`.`,
      ].join('\n'),
    });
  }

  if (args.has('--update')) {
    writeFileSync(file, JSON.stringify(watch, null, 2) + '\n');
    console.log('Recorded the current versions.');
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
    if (!args.has('--issues')) continue;
    // A version issue is opened once. A stale-facts issue is opened again once the last one is closed.
    const state = recheck.open ? 'open' : 'all';
    const existing = JSON.parse(execFileSync('gh', ['issue', 'list', '--state', state, '--search', `in:title "${recheck.title}"`, '--json', 'title'], { encoding: 'utf8' }));
    if (existing.some(issue => issue.title === recheck.title)) continue;
    execFileSync('gh', ['issue', 'create', '--title', recheck.title, '--body', recheck.body], { stdio: 'inherit' });
  }
}

await main();
