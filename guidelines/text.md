# Text

Text on glasses is read at a glance, often while walking, over whatever is behind the lens. It needs to be larger and heavier than text on a phone or monitor.

| Rule | Number | Basis | Lint |
|---|---|---|---|
| Keep all text at or above the minimum size. | 0.6° of visual angle. On Meta Ray-Ban Display, never below 16px. | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/type), [Meta](https://wearables.developer.meta.com/docs/develop/webapps/wearables-web-app-game-plugin/) | `text/min-size` |
| Set most text in the comfortable range. | 0.7° to 0.9° | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/type) | |
| Do not use thin weights. | Weight 400 or more | vendor rule, project number: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/type), [Microsoft](https://learn.microsoft.com/en-us/windows/mixed-reality/design/typography) | `text/thin-weight` |
| Do not use condensed typefaces. | Normal width or wider | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/type) | `text/condensed` |
| Let text wrap. Do not put it in fixed-height boxes. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | |

## Notes

- Vendors disagree on the minimum. Google gives 0.6° for display glasses. Microsoft's older guidance for HoloLens gives 0.35° to 0.5°. Meta gives no angle, only 16px for game HUD text, which is about 0.4° at 42 PPD. The lint reports text under the device minimum as an error and text under 0.6° as a warning.
- No source says whether the angle refers to the font size or the height of the letters. Google's own example treats it as font size, and so does this project.
- On devices with a fixed system font, such as Even G2, size cannot be chosen. Use line and character counts instead; see [Density](./density.md).

## What public apps do

Of 219 public Meta Ray-Ban Display web apps measured on 2026-11-12, 68% had text below 16px and 4% had body text at or above 0.6°. The median body size was 16px.
