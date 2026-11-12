# Input

There is no pointer and no keyboard. The wearer moves focus one step at a time and selects. Every extra control is another gesture.

## Common to display glasses

| Rule | Basis |
|---|---|
| Design for a small gesture set: move, select, go back. | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/), [Even](https://hub.evenrealities.com/docs/build/display) |
| Nothing may depend on hover or drag. | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) |
| Avoid text entry. Offer choices, voice, or a step on the phone. | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) |
| Show clearly which item has focus. | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) |

## Meta Ray-Ban Display web apps

Gestures arrive as arrow keys and Enter. The WebView moves focus between elements by itself, and the Back gesture calls `history.back()`.

| Rule | Number | Basis | Lint |
|---|---|---|---|
| Use plain focusable HTML and let the built-in navigation move focus. Do not write your own arrow-key focus manager. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) | |
| Do not use a positive `tabindex`. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) | `input/positive-tabindex` |
| Do not add your own Back, Home or Close buttons. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/screen-patterns/) | `input/in-app-back` |
| Keep the history short. | 5 entries at most, the first screen included | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) | |
| Give every focusable control an accessible name. | | vendor: [Meta](https://raw.githubusercontent.com/meta/meta-wearables-webapp/main/AGENTS.md) | `input/unnamed-control` |
| No password or date inputs. | | vendor: [Meta](https://wearables.developer.meta.com/docs/develop/webapps/build/input-and-navigation/) | `input/text-entry` |
| Ask for sensor or location permission only inside a user action. | | vendor: [Meta](https://raw.githubusercontent.com/meta/meta-wearables-webapp/main/AGENTS.md) | |

## Even G2

Gestures are press, double press, swipe up, swipe down and long press. There is no camera and no speaker, and an app runs only while it is in the foreground. Source: [Even Hub documentation](https://hub.evenrealities.com/docs/build/display).
