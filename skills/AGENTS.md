## Smart glasses display

This app runs on a smart glasses display. It is small, see-through and read in a glance. Input is a few gestures.

- One task per screen. Headers of two words. At most 7 choices.
- Text at least 0.6° of visual angle (25px on Meta Ray-Ban Display), never below the vendor minimum (16px there). Weight 400 or heavier.
- Black background. Black is transparent. Light content on dark surfaces, few lit pixels.
- Do not show state by color alone.
- Navigation works with move, select and back only. No hover, no drag, no text entry.
- No Back, Home or Close buttons. No positive `tabindex`. Every control has an accessible name.
- Lay out from the real viewport: `width=device-width`, relative units, no hard-coded screen size.
- Capture only after a user action. Never identify people. Ask for permissions inside a user action.

Check each screen after changing it:

```bash
node <path to open-smartglasses>/packages/lint/bin/osg-lint.js <url or file>
```

Rules, numbers and sources: https://github.com/open-smartglasses/open-smartglasses/tree/main/guidelines
