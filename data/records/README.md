# Compatibility records

Places where a glasses app breaks on the device although the official material says otherwise, says nothing, or says it where it is easy to miss. One JSON file per record, in a folder per device. The format is [`../schema/record.schema.json`](../schema/record.schema.json).

## Kinds

| Kind | Meaning |
|---|---|
| `contradiction` | Official material disagrees with the device, or with other official material. |
| `undocumented` | Behaviour no official material mentions. |
| `documented-limit` | Stated by the vendor, and easy to miss. |
| `question` | Not known yet. |

## Evidence

Each record lists what was observed, when, and with which versions. The table shows the highest level reached.

| Level | Meaning |
|---|---|
| `reported` | Someone else's report, linked. Not reproduced here. |
| `runtime` | Reproduced here in a browser or Node, without the vendor's host. |
| `simulator` | Reproduced here in the vendor's simulator. |
| `hardware` | Reproduced here on the device. |

An entry can also say `not-reproduced`. A record stays after the vendor fixes it, with `fixedIn` filled in: apps on older releases still meet it.

**Recheck** means the newest sighting is on an older SDK than the current one. The behaviour may have changed.

## Probes

Scripts in [`scripts/probes`](../../scripts/probes) reproduce records. Each record's `repro` names its probe.

| Probe | Needs |
|---|---|
| `even-sdk-exports.mjs` | Chrome or Chromium |
| `even-sdk-timers.mjs` | Chrome or Chromium |
| `even-simulator.mjs` | The Even Hub simulator: `npm install @evenrealities/evenhub-simulator`. It opens a window. |

## Even Realities G2

<!-- generated:records-even-g2 -->
| Record | Kind | Evidence | Seen with | Status |
|---|---|---|---|---|
| [The background-state skill imports two functions the SDK does not export](./even-g2/background-state-skill-missing-api.json) | Docs disagree | runtime | SDK 0.0.16, Chromium 157.0.8103.51 |  |
| [The CLI has no non-interactive login; CI must reuse a copied session](./even-g2/cli-login-interactive-only.json) | Documented, easy to miss | reported |  |  |
| [How long does the display stay on with no input?](./even-g2/display-timeout-without-input.json) | Open question |  |  |  |
| [Do input events reach an app while the phone is locked?](./even-g2/events-while-phone-locked.json) | Open question |  |  |  |
| [Official examples declare a min_sdk_version below the store floor, and the CLI packs it](./even-g2/examples-declare-sdk-below-store-floor.json) | Docs disagree | runtime | CLI 0.2.0, Windows 11 |  |
| [After the exit dialog appears, image updates fail until the app is relaunched](./even-g2/exit-dialog-breaks-image-updates.json) | Undocumented | reported | SDK 0.0.14, CLI 0.1.12 | Recheck: last seen on SDK 0.0.14, current 0.0.16 |
| [After the exit dialog appears, the microphone will not open until the app is relaunched](./even-g2/exit-dialog-stops-microphone.json) | Undocumented | reported | SDK 0.0.14, iOS | Recheck: last seen on SDK 0.0.14, current 0.0.16 |
| [Can a wearer tell all 16 grey levels apart?](./even-g2/grey-levels-distinguishable.json) | Open question |  |  |  |
| [Hot reload leaves a blank display: createStartUpPageContainer returns 1](./even-g2/hot-reload-blank-display.json) | Docs disagree | simulator | SDK 0.0.16, simulator 0.9.5, Windows 11 |  |
| [An image sent right after a text update fails with sendFailed](./even-g2/image-after-text-update-fails.json) | Undocumented | reported | SDK 0.0.11, firmware 2.2.8.4, iOS 26.5.2 | Recheck: last seen on SDK 0.0.11, current 0.0.16 |
| [On iOS a WebView killed in the background comes back as a white screen](./even-g2/ios-background-webview-white-screen.json) | Docs disagree | reported | app 2.2.5, iOS |  |
| [Characters outside the firmware font are dropped with no placeholder](./even-g2/missing-glyphs-dropped.json) | Documented, easy to miss | reported |  |  |
| [One press can deliver two events: a textEvent, then a sysEvent](./even-g2/press-delivers-two-events.json) | Undocumented | reported, disputed | SDK 0.0.13 | Recheck: last seen on SDK 0.0.13, current 0.0.16 |
| [The quickstart reads taps from textEvent, but taps arrive in sysEvent](./even-g2/quickstart-reads-taps-from-text-event.json) | Docs disagree | simulator, disputed | SDK 0.0.16, simulator 0.9.5, Windows 11 |  |
| [Clearing a native timer can cancel an SDK timer](./even-g2/sdk-timer-id-collision.json) | Undocumented | runtime | SDK 0.0.16, Chromium 157.0.8103.51 |  |
| [The simulator draws more image containers than the glasses show](./even-g2/simulator-allows-extra-image-containers.json) | Docs disagree | reported |  |  |
| [A single tap arrives with no eventType, so === CLICK_EVENT never matches](./even-g2/tap-has-no-event-type.json) | Documented, easy to miss | simulator | SDK 0.0.16, simulator 0.9.5, Windows 11 |  |
| [Text limits are UTF-8 bytes, one below the documented character counts](./even-g2/text-limits-in-bytes.json) | Docs disagree | reported | firmware 2.2.6.10 |  |
<!-- /generated -->

## Meta Ray-Ban Display

<!-- generated:records-mrbd -->
| Record | Kind | Evidence | Seen with | Status |
|---|---|---|---|---|
| [The Back gesture did not reach web apps before glasses release 125.1](./mrbd/back-gesture-not-delivered.json) | Docs disagree | reported |  | Fixed in firmware 125.1 |
| [Web apps cannot use the glasses camera](./mrbd/no-camera-in-web-apps.json) | Undocumented | reported |  |  |
| [The simulator QA overflow check flags hidden UI Toolkit elements](./mrbd/qa-test-overflow-hidden-elements.json) | Docs disagree | reported | simulator 0.6.0, toolkit 129.0.0, Chrome, macOS |  |
| [The simulator QA Test wants width=600 in the viewport meta; the docs say device-width](./mrbd/qa-test-viewport-600.json) | Docs disagree | reported | simulator 0.6.0, toolkit 129.0.0, Chrome, macOS |  |
| [WebMCP tools register, but Meta AI never calls them](./mrbd/webmcp-tools-never-invoked.json) | Undocumented | reported | firmware 130.0.1.241.221, app 298.0.0.28.160, Android 16, Chrome 154.0.8037.92 WebView |  |
<!-- /generated -->

## Checks built on records

The lint cites a record when a finding rests on it. `input/tap-form` taps an Even Hub app in the form the host sends and in the forms apps expect, from [`tap-has-no-event-type`](./even-g2/tap-has-no-event-type.json) and [`quickstart-reads-taps-from-text-event`](./even-g2/quickstart-reads-taps-from-text-event.json).

## Adding a record

Write the file, then run `npm run facts` to update the tables here and the lists in the platform notes. `npm test` checks every record against the schema.

- Link every report. Give the versions the report states, and leave out what it does not.
- Paraphrase. Do not copy reports.
- Add `runtime`, `simulator` or `hardware` evidence only for what you reproduced yourself, with the date and versions.
