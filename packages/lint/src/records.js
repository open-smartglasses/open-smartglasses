import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// The published package ships a copy in ./records; in the repo the source is data/records.
const shipped = path.join(here, '..', 'records');
const repo = path.join(here, '..', '..', '..', 'data', 'records');
const dirs = here.split(path.sep).includes('node_modules') ? [shipped] : [repo, shipped];
const LEVELS = ['reported', 'runtime', 'simulator', 'hardware'];
const REPO = 'https://github.com/open-smartglasses/open-smartglasses/blob/main/data/records';

// A compatibility record, with the highest evidence level it reached and a link to it.
export function loadRecord(device, id) {
  const dir = dirs.find(existsSync);
  if (!dir) throw new Error('No compatibility records found.');
  const record = JSON.parse(readFileSync(path.join(dir, device, `${id}.json`), 'utf8'));
  const level = record.evidence
    .filter(e => e.result === 'reproduced')
    .reduce((top, e) => Math.max(top, LEVELS.indexOf(e.level)), -1);
  return { ...record, level: LEVELS[level] ?? 'none', url: `${REPO}/${device}/${id}.json` };
}
