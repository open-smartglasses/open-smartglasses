# Meta Ray-Ban Display

Read with `hud-design`. Facts and sources: [`data/devices/mrbd.json`](../../data/devices/mrbd.json).

## How an app runs

The app is a web page in a WebView on the glasses. Ordinary HTML, CSS and JavaScript.

## Display

- Test at 600×600, device pixel ratio 1. Do not hard-code the size: use `<meta name="viewport" content="width=device-width, initial-scale=1">` and relative units.
- Additive color. Black is transparent.
- About 42 pixels per degree, a press figure. 0.6° is 25px.
- Text in controls never below 14px.

## Input

- Gestures arrive as `keydown` events: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`.
- The WebView moves focus between focusable elements by itself. Use buttons and links, and do not write a focus manager.
- No positive `tabindex`.
- The Back gesture belongs to the system. It calls `history.back()` when there is a previous entry. Do not add Back, Home or Close buttons.
- History holds 5 entries, the first document included.
- Every focusable control needs an accessible name.
- No password or date inputs.
- Ask for motion, orientation or location permission inside a user action.

## Known issues

Open [compatibility records](../../data/records) for Meta Ray-Ban Display. Each says how far it was reproduced.

<!-- generated:notes-mrbd -->
- **Web apps cannot use the glasses camera.** Build camera features as a native app with the Device Access Toolkit. Meta has not said how to combine it with a web app. ([record](../../data/records/mrbd/no-camera-in-web-apps.json), reported)
- **The simulator QA overflow check flags hidden UI Toolkit elements.** Treat these two findings as false positives after checking by hand that nothing scrolls sideways. ([record](../../data/records/mrbd/qa-test-overflow-hidden-elements.json), reported)
- **The simulator QA Test wants width=600 in the viewport meta; the docs say device-width.** Keep width=device-width, initial-scale=1 as the docs say, and expect this QA Test item to fail. ([record](../../data/records/mrbd/qa-test-viewport-600.json), reported)
- **WebMCP tools register, but Meta AI never calls them.** Keep every tool action reachable by hand, as the page already requires, and do not rely on voice invocation. ([record](../../data/records/mrbd/webmcp-tools-never-invoked.json), reported)
<!-- /generated -->

## Check

```bash
node packages/lint/bin/osg-lint.js <url or html file>
```

The lint renders the first screen at 600×600 and checks it. It does not send gestures, so later screens are not checked unless they have their own URL.
