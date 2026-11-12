#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { lint, listDevices } from '../src/index.js';
import { format } from '../src/report.js';

const HELP = `Usage: osg-lint <url or file> [options]

Options:
  -d, --device <id>       Device profile (default: mrbd). Available: ${listDevices().join(', ')}
      --json              Print the result as JSON
      --screenshot <png>  Save the rendered screen
  -h, --help              Show this help

Exit code is 1 when an error-level rule fails.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    device: { type: 'string', short: 'd', default: 'mrbd' },
    json: { type: 'boolean', default: false },
    screenshot: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length !== 1) {
  console.log(HELP);
  process.exit(values.help ? 0 : 2);
}

try {
  const result = await lint(positionals[0], { device: values.device, screenshotPath: values.screenshot });
  console.log(values.json ? JSON.stringify(result, null, 2) : format(result));
  process.exitCode = result.summary.errors ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
