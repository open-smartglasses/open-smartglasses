#!/usr/bin/env node
// Checks that relative links in the Markdown files point at files that exist.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { root, markdownFiles, readText } from './lib.mjs';

const broken = [];
for (const file of markdownFiles()) {
  const text = readText(file).text.replace(/```[\s\S]*?```/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const resolved = path.join(root, path.dirname(file), decodeURIComponent(target.split('#')[0]));
    if (!existsSync(resolved)) broken.push(`${file}: ${target}`);
  }
}

if (broken.length) {
  console.error(broken.join('\n'));
  process.exit(1);
}
console.log('Links resolve.');
