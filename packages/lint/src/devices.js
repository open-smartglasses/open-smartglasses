import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// The published package ships a copy in ./devices; in the repo the source is data/devices.
const dirs = [path.join(here, '..', 'devices'), path.join(here, '..', '..', '..', 'data', 'devices')];

function deviceDir() {
  const dir = dirs.find(existsSync);
  if (!dir) throw new Error('No device profiles found.');
  return dir;
}

export function listDevices() {
  return readdirSync(deviceDir())
    .filter(f => f.endsWith('.json'))
    .map(f => f.slice(0, -5));
}

export function loadDevice(id) {
  const file = path.join(deviceDir(), `${id}.json`);
  if (!existsSync(file)) {
    throw new Error(`Unknown device "${id}". Available: ${listDevices().join(', ')}`);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}
