import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function devices() {
  const dir = path.join(root, 'data', 'devices');
  return Object.fromEntries(
    readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .map(f => {
        const device = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
        return [device.id, device];
      }),
  );
}

// Files are compared and edited with LF and written back with the line ending they had.
export function readText(file) {
  const raw = readFileSync(path.join(root, file), 'utf8');
  return { text: raw.replace(/\r\n/g, '\n'), eol: raw.includes('\r\n') ? '\r\n' : '\n' };
}

export function writeText(file, text, eol) {
  writeFileSync(path.join(root, file), text.replace(/\n/g, eol));
}

export function markdownFiles(dir = '.') {
  const skip = new Set(['node_modules', '.git']);
  const out = [];
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(rel));
    else if (entry.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

// Compatibility records in data/records/<device>/<id>.json, as { path, record }.
export function records() {
  const dir = path.join(root, 'data', 'records');
  const out = [];
  for (const device of readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()) {
    for (const file of readdirSync(path.join(dir, device)).filter(f => f.endsWith('.json')).sort()) {
      out.push({ path: `data/records/${device}/${file}`, record: JSON.parse(readFileSync(path.join(dir, device, file), 'utf8')) });
    }
  }
  return out;
}

export const LEVELS = ['reported', 'runtime', 'simulator', 'hardware'];

// The reproduced evidence that reached the highest level, latest first among equals.
export function strongest(record) {
  return (record.evidence ?? [])
    .filter(e => e.result === 'reproduced')
    .sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || b.date.localeCompare(a.date))[0];
}

// Compares dotted version strings numerically. Non-numeric parts compare as 0.
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}
