# Device profiles

One JSON file per device in [`devices`](./devices). The format is [`schema/device.schema.json`](./schema/device.schema.json).

| Profile | Device | Runtime | Lint |
|---|---|---|---|
| [`mrbd`](./devices/mrbd.json) | Meta Ray-Ban Display | Web Apps | Yes |
| [`even-g2`](./devices/even-g2.json) | Even Realities G2 | Even Hub | Yes |
| [`android-xr`](./devices/android-xr.json) | Android XR display glasses | Jetpack Compose Glimmer | No |

## Facts

Every value in a profile is a fact:

```json
"ppd": {
  "value": 42,
  "grade": "press",
  "source": "https://uploadvr.com/meta-ray-ban-display-glasses-officially-announced",
  "checked": "2026-11-12"
}
```

| Field | Meaning |
|---|---|
| `value` | The value. `null` when the grade is `unknown`. |
| `grade` | How well the value is established. See below. |
| `source` | Where it is stated. Required unless the grade is `unknown`. |
| `checked` | The date someone last read the source and found the value there. |
| `note` | One line of context, optional. |

## Grades

| Grade | Meaning |
|---|---|
| `unknown` | No usable source. |
| `press` | Reported by media, not stated by the vendor. |
| `docs` | Stated in vendor documentation. |
| `simulator` | Observed in the vendor's simulator or emulator. |
| `hardware` | Measured on the device. |

The lint prints the grade of the fact behind each finding. A rule that needs an `unknown` fact does not run.

## Groups

| Group | Holds |
|---|---|
| `display` | `viewport`, `devicePixelRatio`, `ppd`, `color`, `levels` |
| `text` | Text minimums the vendor states, in the vendor's unit |
| `input` | Gestures, the events they arrive as, what the system reserves |
| `limits` | Hard limits of the runtime |
| `hardware` | Sensors and outputs an app can or cannot count on |

## Changing a fact

Change the value, the source and the `checked` date together. Raise a grade only with a source of that grade. `npm test` validates every profile against the schema.
