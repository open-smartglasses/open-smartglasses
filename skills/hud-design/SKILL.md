---
name: hud-design
description: Design rules for apps on display smart glasses (Meta Ray-Ban Display, Even G2, Android XR display glasses and similar). Use before writing or changing any screen that will be shown on a glasses display.
---

# Designing for a glasses display

A glasses display is small, see-through, and read in a glance of a second or two, often while walking. Input is a few gestures, with no pointer and no keyboard. Design for that, not for a phone.

Source and reasoning for every rule: https://github.com/open-smartglasses/open-smartglasses/tree/main/guidelines

## First, find the device

Read the device profile before choosing sizes. Profiles are in https://github.com/open-smartglasses/open-smartglasses/tree/main/data/devices

<!-- generated:devices -->
| Device | Screen | Pixels per degree | Color | Input |
|---|---|---|---|---|
| Meta Ray-Ban Display (`mrbd`) | 600×600 | 42 | Additive, full color | Keys: Up, Down, Left, Right, Enter |
| Even Realities G2 (`even-g2`) | 576×288 | Not published | Green only, 16 levels | press, double press, swipe up, swipe down, long press |
| Android XR display glasses (`android-xr`) | Not published | Not published | Additive, full color | tap, swipe |
<!-- /generated -->

Meta's size is the one to test at, not a fixed size. Android XR publishes no resolution: lay out in dp and sp. On Android XR, swipe down is Back.

If the user has not said which device, ask. Then read the note for that platform: https://github.com/open-smartglasses/open-smartglasses/tree/main/skills/platforms

## One screen, one thing

- Each screen answers one question or offers one action.
- Headers are two words at most.
- A list or a set of choices has 7 items at most. Every item is one more gesture.
- Do not make the wearer read paragraphs. Split long content across screens or move it to the phone.
- Show the screen only while it is needed.

## Text

- Minimum size is 0.6° of visual angle. Multiply by the device's pixels per degree: 25px on Meta Ray-Ban Display, 18sp on Android XR.
- Set most text at 0.7° to 0.9°: 29 to 38px on Meta Ray-Ban Display.
- Never go below the vendor minimum: 16px on Meta Ray-Ban Display.
- Weight 400 or heavier. No thin or light weights, no condensed faces.
- Let text wrap. No fixed-height text boxes.
- On Even G2 the font is fixed. Count characters instead: about 400 to 500 fill the screen, and a list item holds 64.

## Color and light

- Black is transparent. Keep the background black and let the world show through.
- Light only the pixels the content needs. No bright panels, no full-screen fills.
- Light content on dark surfaces, never dark text on a light surface.
- Separate things by brightness, not hue. On a green-only display hue does not exist.
- Do not show state by color alone. Change the outline, weight, icon or label too.

## Input

- The gesture set is: move, select, back. Nothing may need hover, drag or a pointer.
- Make it obvious which item has focus.
- Avoid text entry. Offer choices, voice, or a step on the phone. No password or date fields.
- Do not add Back, Home or Close buttons. The system gesture does that.
- On Meta Ray-Ban Display, use plain focusable HTML and let the built-in navigation move focus. No positive `tabindex`, no custom arrow-key focus manager. Give every control an accessible name. Keep history to 5 entries.
- On Even G2, only one container per page receives events, and a page holds 4 image containers and 8 others at most.

## Layout

- Lay out from the real viewport. On the web use `<meta name="viewport" content="width=device-width, initial-scale=1">` and relative units. Do not hard-code 600.
- Never wider than the screen. One scroll area, not nested ones.
- Keep a page to about two screens of scrolling.

## Privacy and safety

- Capture audio or video only after the wearer starts it, and show that it is on.
- Never identify people by face or voice.
- Ask for sensor or location permission inside a user action, not on load.
- No sudden full-screen visuals. No demo values shown as live data. No secrets in the bundle.

## When the screen is built

Check it with the `hud-review` skill.
