# @open-smartglasses/lint

Checks a smart glasses app on the screen it actually renders. Supports Meta Ray-Ban Display web apps and Even G2 apps built on Even Hub. Needs Node 20 or later, and Chrome, Edge or Playwright's Chromium to render the app.

```bash
npx @open-smartglasses/lint https://your-app.example
npx @open-smartglasses/lint http://localhost:5173 --device even-g2 --manifest app.json
```

```
error  text/min-size  1 text node(s) in controls below the 14px minimum for interactive elements on Meta Ray-Ban Display.
       vendor rule, grade: docs, https://github.com/meta/meta-wearables-webapp/blob/main/...
       - 12px  "Stop"  body > main > button.meta
```

Each finding names its source: a vendor rule, a value derived from vendor guidance, a project rule, or a [compatibility record](https://github.com/open-smartglasses/open-smartglasses/tree/main/data/records). The exit code is 1 when an error-level rule fails, so it can run in CI.

## Meta Ray-Ban Display

Renders the first screen at 600×600 and runs 15 rules for text size and weight, color on an additive display, layout, and input.

## Even G2

Stands in for the Even host, records the page the app builds, and checks it against the limits of Even Hub: container counts, bounds, image size, event capture, list and text length in UTF-8 bytes.

Then it taps the event container as the glasses send a tap, with no `eventType`, and in the forms apps often expect. An app that calls the host only after the latter is reported. The taps reach the app, so run the check on a local build or with a test backend, or pass `--no-taps`.

`--manifest app.json` checks what `evenhub pack` lets through and the store review rejects. A `min_sdk_version` below the floor is an error. "Even" in the name and a network permission with no whitelist are warnings: Even allows the name for affiliated apps, and its packaging page calls the whitelist optional. It also runs on its own:

```bash
npx @open-smartglasses/lint --device even-g2 --manifest app.json
```

## Options

```
-d, --device <id>        mrbd (default), even-g2
    --manifest <file>    Also check an Even Hub app.json against the store rules
    --no-taps            Do not send taps to an Even Hub app
    --json               Print the result as JSON
    --screenshot <png>   Save the rendered screen (web apps only)
-h, --help               Show this help
```

## From code

```js
import { lint, lintManifest } from '@open-smartglasses/lint';

const result = await lint('http://localhost:5173', { device: 'even-g2', manifest: 'app.json' });
console.log(result.summary); // { errors, warnings, notes }
```

Guidelines, device profiles and records: https://github.com/open-smartglasses/open-smartglasses
