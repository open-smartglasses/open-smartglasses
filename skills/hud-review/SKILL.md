---
name: hud-review
description: Review a smart glasses app screen against the Open Smartglasses guidelines, using the osg-lint tool on the rendered screen plus a manual checklist. Use after building or changing a screen for a glasses display, or when asked to review one.
---

# Reviewing a glasses screen

Review the rendered screen, not the source. Sizes and colors in code say little about what reaches the display.

## 1. Run the lint

The lint renders the app at the device's viewport and checks the result. It supports web apps for Meta Ray-Ban Display. It needs Node 20+ and Chrome.

```bash
git clone https://github.com/open-smartglasses/open-smartglasses
cd open-smartglasses && npm install
node packages/lint/bin/osg-lint.js <url or html file> --json --screenshot screen.png
```

Reuse the clone if it already exists. For an app that is not deployed, start its dev server and pass the local URL.

Exit code 1 means an error-level rule failed. Exit code 2 means the lint could not run; read the message.

For other devices there is no lint yet. Go to step 3 and do the whole checklist by hand.

## 2. Read the result

Each finding has a `severity`, a `basis` and a `grade`.

| Field | Values | What to do |
|---|---|---|
| `severity` | `error` | Fix it. |
| | `warn` | Fix it unless there is a reason not to, and say the reason. |
| | `info` | Look at it. It may be fine. |
| `basis` | `vendor` | A vendor states this rule and number. |
| | `derived` | A vendor rule with a number converted for this device. |
| | `project` | This project's number. No vendor gives one. |
| `grade` | `docs`, `press`, ... | How well the device fact behind the number is established. |

Open `screen.png` and look at it. The lint checks the first screen only; move through the other screens and run it on each URL or state you can reach.

## 3. Check what the lint cannot

- [ ] The screen does one thing. A wearer can take it in within two seconds.
- [ ] Headers are two words at most.
- [ ] The focused item is obvious at a glance.
- [ ] Every screen can be reached and left with move, select and back only.
- [ ] Nothing depends on hover, drag or a pointer.
- [ ] State is not shown by color alone.
- [ ] No more than 7 choices on a screen.
- [ ] No custom arrow-key focus manager on Meta Ray-Ban Display. History stays within 5 entries.
- [ ] On Even G2: 4 image containers and 8 others at most, lists of 20 items and 64 characters at most, one container receiving events.
- [ ] Sensor and location permissions are asked inside a user action.
- [ ] Nothing is captured before the wearer starts it. Nobody is identified by face or voice.
- [ ] The app still works with permissions denied.

Rules and sources: https://github.com/open-smartglasses/open-smartglasses/tree/main/guidelines

## 4. Report

List findings worst first. For each: what is wrong, where (selector or screen), the rule, and the fix. Keep vendor rules apart from project rules so the reader can weigh them. State which screens were checked and which were not.

After fixing, run the lint again and report the new result.
