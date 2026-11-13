# Density

A glasses screen is looked at for a second or two. It should answer one question or offer one action.

| Rule | Number | Basis | Lint |
|---|---|---|---|
| One task per screen. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/screen-patterns/) | |
| Keep headers short. | 2 words | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/theme/typography/) | |
| Keep lists and choices short. | 7 items | derived: [Snap](https://developers.snap.com/spectacles/best-practices/design-for-spectacles/design-best-practices) gives 7 for Spectacles | `input/many-choices` |
| Do not make the page wider than the screen. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | `layout/overflow` |
| One scroll area per direction. Do not nest them. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | `layout/nested-scroll` |
| Avoid long scrolling pages. | Notes above 2 screens | project | `layout/overflow` |
| Lay out from the real viewport. Do not hard-code its size. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) | `layout/viewport-meta` |

## Device limits

| Device | Limit | Source |
|---|---|---|
| Meta Ray-Ban Display | 600×600 is the size to test at, not a fixed size to build for. | [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/display-and-layout/) |
| Even G2 | 576×288. A page holds at most 4 image containers and 8 others. A list holds at most 20 items of 64 characters. The lint checks these: `container/count`, `container/bounds`, `list/length`, `text/length`. | [Even](https://hub.evenrealities.com/docs/build/display) |

## What public apps do

Of 252 public Meta Ray-Ban Display web apps, 53% fix the viewport width at 600px instead of using `width=device-width`.
