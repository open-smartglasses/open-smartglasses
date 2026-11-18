// Copies the device profiles, records and license into the package before npm packs it,
// and removes them after, so runs in the repo read data/ itself.
//   node scripts/pack-data.mjs copy | clean
import { cpSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const command = process.argv[2];
if (command !== 'copy' && command !== 'clean') {
  console.error('Usage: node scripts/pack-data.mjs copy | clean');
  process.exit(2);
}

const pkg = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.join(pkg, '..', '..');
for (const copy of ['devices', 'records', 'LICENSE']) rmSync(path.join(pkg, copy), { recursive: true, force: true });

if (command === 'copy') {
  // The package reads only the JSON. The READMEs link to files it does not ship.
  const json = src => statSync(src).isDirectory() || src.endsWith('.json');
  cpSync(path.join(repo, 'data', 'devices'), path.join(pkg, 'devices'), { recursive: true, filter: json });
  cpSync(path.join(repo, 'data', 'records'), path.join(pkg, 'records'), { recursive: true, filter: json });
  copyFileSync(path.join(repo, 'LICENSE'), path.join(pkg, 'LICENSE'));
}
