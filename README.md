# Open Smartglasses

Design rules for smart glasses apps, and tools that check them. Cross-brand.

For people who build apps for small glasses displays, and for the coding agents they work with.

English · [한국어](./README.ko.md)

**Status:** in development. The lint runs from source; nothing is published to npm yet.

## Try the lint

It checks Meta Ray-Ban Display web apps and Even G2 apps built on Even Hub. It needs Node 20+ and Chrome.

```bash
git clone https://github.com/open-smartglasses/open-smartglasses
cd open-smartglasses && npm install
node packages/lint/bin/osg-lint.js https://your-app.example
node packages/lint/bin/osg-lint.js https://your-app.example --device even-g2
```

```
error  text/min-size  13 text node(s) below the 16px minimum for Meta Ray-Ban Display.
       vendor rule, grade: docs, https://wearables.developer.meta.com/docs/...
       - 11.4px  "World time"  div.row > div.row-main > div.row-sub
```

Each finding says where its threshold comes from: a vendor rule, a value derived from vendor guidance, or a project rule. Add `--json` for machine-readable output. The exit code is 1 when an error-level rule fails.

For Meta Ray-Ban Display it renders the first screen and runs 15 rules for text, color, layout and input. For Even G2 it stands in for the Even host, records the page the app builds, and runs 9 rules for the limits of that page. The [guidelines](./guidelines) explain each one and give its source.

## Use with a coding agent

Copy [`skills/hud-design`](./skills/hud-design) and [`skills/hud-review`](./skills/hud-review) into your agent's skills folder, or append [`skills/AGENTS.md`](./skills/AGENTS.md) to your project's `AGENTS.md`. The first gives the agent the design rules before it writes a screen. The second has it run the lint on the result.

## Why

We rendered 249 public Ray-Ban Display web apps at 600×600 on 2026-11-12. Of the 219 that show text on the first screen:

- 68% have text below Meta's own 16px minimum.
- 4% have body text at or above 0.6° of visual angle, the minimum Google gives for display glasses.

The median body text size was 16px, the web default. Across all the apps that loaded, 53% fix the viewport width at 600px, which Meta's layout guide says not to do.

## Contents

| Part | What it is |
|---|---|
| **[Guidelines](./guidelines)** | Text legibility, color on additive and monochrome displays, one-dimensional input, information per screen, privacy. Written in angular size, tone and seconds, so they hold across devices. |
| **[Device profiles](./data)** | Display, input and runtime facts per device: Meta Ray-Ban Display, Even G2, Android XR. Each fact carries its source, the date it was checked, and a grade from `unknown` to `hardware`. |
| **Lint** | Renders an app headlessly and checks the screenshot against the guidelines. Structural checks run through one adapter per runtime. |
| **[Agent skills](./skills)** | `hud-design` and `hud-review` for every platform, a short note per platform, and an `AGENTS.md` block. |
| **Evals** | Tasks scored on the rendered result, with and without the skills. |

## Platforms

| Platform | Runtime | First release |
|---|---|---|
| Meta Ray-Ban Display | Web Apps | Guidelines, profile, lint, skill |
| Even Realities G2 | Even Hub | Guidelines, profile, lint, skill |
| Android XR display glasses | Jetpack Compose Glimmer | Profile |
| Rokid, MentraOS | | Profile |

## Out of scope

- A cross-brand runtime or UI framework
- Component libraries and focus engines
- Rewritten vendor SDK documentation
- Simulators and scaffolders

Vendors ship these for their own devices.

## Roadmap

1. **Common layer** — lint core with the DOM adapter, guidelines, fact schema, device profiles, common skills.
2. **Second runtime** — Even Hub adapter, platform notes, first eval run on two platforms.
3. **Hardware verification** — measure on devices and raise facts to the `hardware` grade.

## License

[MIT](./LICENSE)
