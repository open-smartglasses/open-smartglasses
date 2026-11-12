# Color

Display glasses add light to the view. They cannot make anything darker. Black pixels are off, so black is transparent and the world shows through. Everything else follows from that.

| Rule | Number | Basis | Lint |
|---|---|---|---|
| Keep the background black. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | `display/background` |
| Do not fill the screen with a bright color. Light as few pixels as the content needs. | Warns above 30% bright pixels | vendor rule, project number: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/), [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/color) | `display/bright-fill` |
| Use light content on dark surfaces, not dark on light. | | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/color) | `text/dark-on-light` |
| Keep drawn surfaces dark. | Tone 34 or lower | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/color) | |
| Separate content from its surface by tone, not hue. | Tone difference 66 or more, 70 preferred | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/styles/color) | |
| Do not show state by color alone. Change an outline, weight, icon or label as well. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | |

## Notes

- Tone is the T in Google's HCT color space, from 0 (black) to 100 (white).
- Saturation does not make text readable. Meta's guide lists luminance contrast, stroke weight, spacing and bounded surfaces as what does.
- WCAG contrast ratios assume an opaque background. On glasses the real background is the scene behind the lens, so a ratio computed from page colors says less than it does on a monitor.
- Monochrome displays such as Even G2 (green, 16 levels) have no hue at all. Use brightness levels, borders and position to tell things apart.

## What public apps do

Most already follow the background rule. Of 252 public Meta Ray-Ban Display web apps, 12% had a lit background and 8% a bright fill.
