# Agent skills

Instructions for coding agents that build smart glasses apps. They apply to every platform.

| File | Use |
|---|---|
| [`hud-design`](./hud-design/SKILL.md) | Read before writing a screen. |
| [`hud-review`](./hud-review/SKILL.md) | Read after writing one. Runs the lint and a checklist. |
| [`AGENTS.md`](./AGENTS.md) | A short block for agents that do not load skills. |

## Install

Skills are folders with a `SKILL.md`. Copy them to where your agent looks for skills.

Claude Code, for one project:

```bash
git clone https://github.com/open-smartglasses/open-smartglasses
```

```bash
cp -r open-smartglasses/skills/hud-design open-smartglasses/skills/hud-review .claude/skills/
```

For agents that read `AGENTS.md`, append the block:

```bash
cat open-smartglasses/skills/AGENTS.md >> AGENTS.md
```

## With vendor skills

Meta, Even and Google publish skills for their own SDKs. Those cover the API. These cover design, and work alongside them.
