# Evals

Do the skills change what an agent builds? Each task is given to an agent twice, once without the skills and once with them, and the apps it writes are scored on what they put on the display.

## Tasks

One JSON file per task in [`tasks`](./tasks): an id, a device, and the prompt. The prompt is a plain feature request with no design advice in it.

| Task | Device |
|---|---|
| `mrbd-departures`, `mrbd-timer`, `mrbd-recipe` | Meta Ray-Ban Display |
| `even-departures`, `even-recipe` | Even G2 |

## Conditions

| Condition | What the agent gets |
|---|---|
| `baseline` | The prompt. For Even tasks, also the SDK's README. |
| `skills` | The same, plus `hud-design`, the platform note and `hud-review`, with the lint available to run. |

Each run starts from a fresh agent with no other context. The agent writes one `index.html`.

## Scoring

Put the outputs in `<run>/<condition>/<task>/index.html` and run:

```bash
node evals/score.mjs <run directory>
```

It lints every app with the task's device and prints errors, warnings and notes per task and condition.

## Results

| Date | Result |
|---|---|
| [2026-11-13](./results/2026-11-13.md) | Baseline 1 error, 8 warnings. Skills 0 and 0. One run per cell. |

## Limits

- The score is the lint. In the `skills` condition the agent ran the same lint and fixed what it reported, so a clean score there shows the loop works, not that the design is good.
- The lint checks the first screen only.
- Nothing is checked on hardware.
