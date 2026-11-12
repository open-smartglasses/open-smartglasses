# Guidelines

Design rules for apps on display glasses. They are written in units that do not depend on the device (degrees of visual angle, tone, counts) and each one says where its number comes from.

| Guideline | Covers |
|---|---|
| [Text](./text.md) | Size, weight and shape of type |
| [Color](./color.md) | Color and brightness on additive and monochrome displays |
| [Input](./input.md) | Gesture input, focus and navigation |
| [Density](./density.md) | How much goes on one screen |

## Basis

Every number carries one of three labels. The lint prints the same label next to each finding.

| Label | Meaning |
|---|---|
| **vendor** | A device vendor states the rule and the number. |
| **derived** | A vendor states the rule; the number is converted for another device, for example degrees to pixels. |
| **project** | No vendor gives a number. This project chose one. |

## Degrees to pixels

Text size on glasses is measured as visual angle. To get pixels, multiply by the pixels per degree (PPD) of the device, which is in its profile under [`data/devices`](../data/devices).

| Device | PPD | 0.6° | 0.8° |
|---|---|---|---|
| Meta Ray-Ban Display | 42 (press figure) | 25px | 34px |
| A 30 PPD display, Google's example | 30 | 18px | 24px |
