import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

export const SDK = '@evenrealities/even_hub_sdk';

// The SDK version to probe: --sdk <version>, or the one data/watch.json last recorded.
export function sdkVersion(args) {
  if (args.includes('--sdk')) return args[args.indexOf('--sdk') + 1];
  const watch = JSON.parse(readFileSync(new URL('../../data/watch.json', import.meta.url), 'utf8'));
  return watch.sources.find(s => s.package === SDK).seen;
}

// Reads one file out of an npm tarball.
function untar(buffer, wanted) {
  for (let at = 0; at + 512 <= buffer.length; ) {
    const header = buffer.subarray(at, at + 512);
    const name = header.subarray(0, 100).toString().replace(/\0.*$/s, '');
    if (!name) break;
    const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/s, '').trim() || '0', 8);
    if (name === wanted) return buffer.subarray(at + 512, at + 512 + size).toString();
    at += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error(`${wanted} not found in the package`);
}

const tarballs = new Map();

// Reads a file from a published npm package, for example packageFile(SDK, '0.0.16', 'dist/index.d.ts').
export async function packageFile(pkg, version, file) {
  const url = `https://registry.npmjs.org/${pkg}/-/${pkg.split('/').pop()}-${version}.tgz`;
  if (!tarballs.has(url)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    tarballs.set(url, gunzipSync(Buffer.from(await response.arrayBuffer())));
  }
  return untar(tarballs.get(url), `package/${file}`);
}

// The SDK's ES module build, fetched from the npm registry.
export const sdkSource = version => packageFile(SDK, version, 'dist/index.js');
