# Meta Ray-Ban Display

Read with `hud-design`. Facts and sources: [`data/devices/mrbd.json`](../../data/devices/mrbd.json).

## How an app runs

The app is a web page in a WebView on the glasses. Ordinary HTML, CSS and JavaScript.

## Display

- Test at 600×600, device pixel ratio 1. Do not hard-code the size: use `<meta name="viewport" content="width=device-width, initial-scale=1">` and relative units.
- Additive color. Black is transparent.
- About 42 pixels per degree, a press figure. 0.6° is 25px.
- Text never below 16px.

## Input

- Gestures arrive as `keydown` events: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`.
- The WebView moves focus between focusable elements by itself. Use buttons and links, and do not write a focus manager.
- No positive `tabindex`.
- The Back gesture belongs to the system. It calls `history.back()` when there is a previous entry. Do not add Back, Home or Close buttons.
- History holds 5 entries, the first document included.
- Every focusable control needs an accessible name.
- No password or date inputs.
- Ask for motion, orientation or location permission inside a user action.

## Check

```bash
node packages/lint/bin/osg-lint.js <url or html file>
```

The lint renders the first screen at 600×600 and checks it. It does not send gestures, so later screens are not checked unless they have their own URL.
