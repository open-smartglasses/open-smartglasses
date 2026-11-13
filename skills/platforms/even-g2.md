# Even Realities G2

Read with `hud-design`. Facts and sources: [`data/devices/even-g2.json`](../../data/devices/even-g2.json).

## How an app runs

The app is a web page inside the Even phone app. It does not draw pixels. It sends the glasses a page made of containers through `@evenrealities/even_hub_sdk`, and receives gesture events back. The glasses have no camera and no speaker.

## Display

- 576×288, green only, 16 brightness levels.
- Three container types: text, list, image. Each is placed by pixel position and size.
- A page holds 4 image containers and 8 text or list containers at most.
- An image container is 288×144 at most.
- The font is fixed. Control length, not size.

## Text and lists

- A text container takes 1,000 characters when a page is created or rebuilt, and 2,000 in an update. About 400 to 500 fill the screen.
- A list holds 20 items of 64 characters. Keep it to 7 where you can: each item is one swipe.
- A list cannot be changed in place. Rebuild the page.
- A container name is 16 characters at most.

## Input

- Gestures: press, double press, swipe up, swipe down, long press.
- Exactly one container per page receives events. Set `isEventCapture: 1` on it and on no other.
- Press followed by a long press opens the system menu. Do not use it.

## Check

```bash
node packages/lint/bin/osg-lint.js <url of the app> --device even-g2
```

The lint loads the app with a stand-in for the Even host and checks the page it builds while loading. It does not send gestures, so pages reached later are not checked.
