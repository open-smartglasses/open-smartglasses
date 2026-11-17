#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { lint, lintManifest, listDevices } from '../src/index.js';
import { format } from '../src/report.js';

const HELP = `Usage: osg-lint <url or file> [options]
       osg-lint --device even-g2 --manifest <app.json> [url or file]

Options:
  -d, --device <id>        Device profile (default: mrbd). Available: ${listDevices().join(', ')}
      --manifest <file>    Also check an Even Hub app.json against the store rules
      --no-taps            Do not send taps to an Even Hub app
      --json               Print the result as JSON
      --screenshot <png>   Save the rendered screen (web apps only)
  -h, --help               Show this help

The Even Hub check sends taps to the app. Run it on a local build or with a test backend.
Exit code is 1 when an error-level rule fails.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    device: { type: 'string', short: 'd', default: 'mrbd' },
    json: { type: 'boolean', default: false },
    screenshot: { type: 'string' },
    manifest: { type: 'string' },
    'no-taps': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length > 1 || (positionals.length === 0 && !values.manifest)) {
  console.log(HELP);
  process.exit(values.help ? 0 : 2);
}

try {
  const options = { device: values.device, screenshotPath: values.screenshot, manifest: values.manifest, taps: !values['no-taps'] };
  const result = positionals.length ? await lint(positionals[0], options) : lintManifest(values.manifest, options);
  console.log(values.json ? JSON.stringify(result, null, 2) : format(result));
  process.exitCode = result.summary.errors ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
