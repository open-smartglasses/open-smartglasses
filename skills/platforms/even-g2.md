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
- Limits are counted in UTF-8 bytes: 999 per text container and 63 per list item in the simulator. Korean, Japanese and Chinese characters take 3 bytes each.
- A list holds 20 items of 64 characters. Keep it to 7 where you can: each item is one swipe.
- A list cannot be changed in place. Rebuild the page.
- A container name is 16 characters at most.

## Input

- Gestures: press, double press, swipe up, swipe down, long press.
- Exactly one container per page receives events. Set `isEventCapture: 1` on it and on no other.
- Press followed by a long press opens the system menu. Do not use it.

## Known issues

Open [compatibility records](../../data/records) for Even G2. Each says how far it was reproduced.

<!-- generated:notes-even-g2 -->
- **The background-state skill imports two functions the SDK does not export.** Do not apply the skill. Save state with bridge.setLocalStorage and restore it on launch. ([record](../../data/records/even-g2/background-state-skill-missing-api.json), runtime)
- **The CLI has no non-interactive login; CI must reuse a copied session.** Store credentials.yaml as a CI secret under a job-owned XDG_CONFIG_HOME, delete the local copy after the job, and never run evenhub logout in CI. ([record](../../data/records/even-g2/cli-login-interactive-only.json), reported)
- **Official examples declare a min_sdk_version below the store floor, and the CLI packs it.** Set min_sdk_version to the store floor or later and rename the app before submitting. osg-lint --device even-g2 --manifest app.json checks both. ([record](../../data/records/even-g2/examples-declare-sdk-below-store-floor.json), runtime)
- **After the exit dialog appears, image updates fail until the app is relaunched.** Reach the dialog only from an explicit Exit item in an in-app menu, the Chess pattern the guidelines accept, and fall back to text after repeated sendFailed. Mode 0 behind a custom confirmation avoids it, but review rejects that on the root page. ([record](../../data/records/even-g2/exit-dialog-breaks-image-updates.json), reported)
- **After the exit dialog appears, the microphone will not open until the app is relaunched.** Reach the dialog only from an explicit Exit item in an in-app menu. When audioControl(true) keeps returning false, ask the user to relaunch the app. ([record](../../data/records/even-g2/exit-dialog-stops-microphone.json), reported)
- **Hot reload leaves a blank display: createStartUpPageContainer returns 1.** Relaunch the simulator or the app after each edit, or call rebuildPageContainer when createStartUpPageContainer returns 1 and check that result too. ([record](../../data/records/even-g2/hot-reload-blank-display.json), simulator)
- **An image sent right after a text update fails with sendFailed.** Wait about 500 ms after the last textContainerUpgrade before calling updateImageRawData. ([record](../../data/records/even-g2/image-after-text-update-fails.json), reported)
- **On iOS a WebView killed in the background comes back as a white screen.** Save state with setLocalStorage as it changes and restore it on launch, so a relaunch resumes where the user left off. ([record](../../data/records/even-g2/ios-background-webview-white-screen.json), reported)
- **Characters outside the firmware font are dropped with no placeholder.** Draw unsupported scripts on the phone and send them as images, within the limit of 4 image containers of 288 x 144 per page. Image containers do not scroll. ([record](../../data/records/even-g2/missing-glyphs-dropped.json), reported)
- **One press can deliver two events: a textEvent, then a sysEvent.** Debounce presses across textEvent and sysEvent together, not per envelope. The first reporter ignores any press within 1.2 s of the previous one. ([record](../../data/records/even-g2/press-delivers-two-events.json), reported, disputed)
- **The quickstart reads taps from textEvent, but taps arrive in sysEvent.** Read presses from sysEvent with eventType ?? 0, as the handle-input skill does. If a text-container click can also arrive, act on only one of the two. ([record](../../data/records/even-g2/quickstart-reads-taps-from-text-event.json), simulator, disputed)
- **Clearing a native timer can cancel an SDK timer.** Keep a reference to the native setTimeout from a module evaluated before the SDK, or avoid clearing timers created before the SDK was imported. ([record](../../data/records/even-g2/sdk-timer-id-collision.json), runtime)
- **The simulator draws more image containers than the glasses show.** Keep to 4 image containers per page whatever the simulator shows. ([record](../../data/records/even-g2/simulator-allows-extra-image-containers.json), reported)
- **A single tap arrives with no eventType, so === CLICK_EVENT never matches.** Coalesce only when the envelope exists: event.sysEvent ? (event.sysEvent.eventType ?? 0) : null. Coalescing the optional chain (event.sysEvent?.eventType ?? 0) turns every other event into a tap. ([record](../../data/records/even-g2/tap-has-no-event-type.json), simulator)
- **Text limits are UTF-8 bytes, one below the documented character counts.** Count UTF-8 bytes (new TextEncoder().encode(text).length): at most 999 per text container, 1,999 per text update and 63 per list item. ([record](../../data/records/even-g2/text-limits-in-bytes.json), reported)
<!-- /generated -->

## Check

```bash
node packages/lint/bin/osg-lint.js <url of the app> --device even-g2 --manifest app.json
```

The lint loads the app with a stand-in for the Even host and checks the page it builds while loading. Then it taps the event container: once as the glasses send a tap, and in the forms apps often expect. An app that answers only the latter is reported. The taps reach the app, so run it on a local build or with a test backend, or pass `--no-taps`. Pages reached after a tap are not checked.

`--manifest` checks `app.json` for what `evenhub pack` lets through and the review rejects: a `min_sdk_version` below the floor, "Even" in the name, a network permission with no whitelist.
