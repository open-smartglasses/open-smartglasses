# Open Smartglasses

Design rules for smart glasses apps, and tools that check them. Cross-brand.

For people who build apps for small glasses displays, and for the coding agents they work with.

English · [한국어](./README.ko.md)

**Status:** in development. No release yet.

## Contents

| Part | What it is |
|---|---|
| **Guidelines** | Text legibility, color on additive and monochrome displays, one-dimensional input, information per screen, privacy. Written in angular size, tone and seconds, so they hold across devices. |
| **Device profiles** | Display, input and runtime facts per device. Each fact carries its source, the date it was checked, and a verification grade: `docs`, `simulator` or `hardware`. |
| **Lint** | Renders an app headlessly and checks the screenshot against the guidelines. Structural checks run through one adapter per runtime. |
| **Agent skills** | `hud-design` and `hud-review` for every platform, short notes per platform, and an `AGENTS.md` block. |
| **Evals** | Tasks scored on the rendered result, with and without the skills. |

## Platforms

| Platform | Runtime | First release |
|---|---|---|
| Meta Ray-Ban Display | Web Apps | Guidelines, profile, lint, skill |
| Even Realities G2 | Even Hub | Guidelines, profile, lint, skill |
| Android XR display glasses | Jetpack Compose Glimmer | Profile, screenshot checks |
| Rokid, MentraOS | | Profile |

## Out of scope

- A cross-brand runtime or UI framework
- Component libraries and focus engines
- Rewritten vendor SDK documentation
- Simulators and scaffolders

Vendors ship these for their own devices.

## Roadmap

1. **Common layer** — fact schema, device profiles, guidelines, lint core with the DOM adapter, common skills.
2. **Second runtime** — Even Hub adapter, platform notes, first eval run on two platforms.
3. **Hardware verification** — measure on devices and raise facts to the `hardware` grade.

## License

[MIT](./LICENSE)
