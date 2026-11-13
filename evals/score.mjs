#!/usr/bin/env node
// Scores a run: lints every <run>/<condition>/<task>/index.html with the task's device.
// Usage: node evals/score.mjs <run directory> [--json out.json]
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../packages/lint/src/index.js';
import { launch } from '../packages/lint/src/browser.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const [runDir, flag, out] = process.argv.slice(2);
if (!runDir) {
  console.error('Usage: node evals/score.mjs <run directory> [--json out.json]');
  process.exit(2);
}

const tasks = readdirSync(path.join(here, 'tasks'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(path.join(here, 'tasks', f), 'utf8')));
const conditions = readdirSync(runDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const browser = await launch();
const rows = [];
try {
  for (const task of tasks) {
    for (const condition of conditions) {
      const file = path.join(runDir, condition, task.id, 'index.html');
      if (!existsSync(file)) {
        rows.push({ task: task.id, condition, missing: true });
        continue;
      }
      const result = await lint(file, { device: task.device, browser });
      rows.push({
        task: task.id,
        condition,
        ...result.summary,
        rules: result.findings.map(f => `${f.severity} ${f.rule}`),
        metrics: result.metrics,
      });
    }
  }
} finally {
  await browser.close();
}

const cell = r => (r.missing ? 'missing' : `${r.errors} / ${r.warnings} / ${r.notes}`);
console.log(`| Task | ${conditions.join(' | ')} |`);
console.log(`|---|${conditions.map(() => '---').join('|')}|`);
for (const task of tasks) {
  console.log(`| ${task.id} | ${conditions.map(c => cell(rows.find(r => r.task === task.id && r.condition === c))).join(' | ')} |`);
}
const total = (c, key) => rows.filter(r => r.condition === c && !r.missing).reduce((sum, r) => sum + r[key], 0);
console.log(`| **Total** | ${conditions.map(c => `${total(c, 'errors')} / ${total(c, 'warnings')} / ${total(c, 'notes')}`).join(' | ')} |`);
console.log('\nCells are errors / warnings / notes.\n');
for (const r of rows.filter(r => !r.missing && r.rules.length)) console.log(`${r.condition}  ${r.task}: ${r.rules.join(', ')}`);

if (flag === '--json' && out) writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
