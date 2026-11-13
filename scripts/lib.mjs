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
