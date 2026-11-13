# CtxKit

A personal context library for AI agents, with project knowledge and session work summaries stored in Markdown.

[中文](README.md) · [Usage guide](docs/usage.en.md)

## Why this project exists

Projects often span many conversations. Past attempts, decision rationale, current blockers, and next steps end up scattered across chats. A new conversation or a different tool means explaining that background again.

CtxKit keeps the information worth carrying forward in files you own. As work progresses, agents read the relevant background and update confirmed outcomes, giving the next conversation a useful starting point.

## Two core concepts

### Project context

Describes **where the project stands now**: goals, scope, important decisions, evidence, blockers, and next steps.

It changes as the project progresses. Detailed reasoning and evidence live in linked documents, keeping the project entry point short.

### Session work summary

Records **what one conversation accomplished**: work completed, conclusions reached, and unresolved questions.

One conversation can cover several projects and continue updating the same summary across days. The summary keeps useful outcomes and references; the original application retains the full chat.

Project context helps you continue work. Session summaries help you look back. A later change in project state does not have to erase what happened earlier.

## How files are organized

This repository keeps workflows in `skills/` and usage documentation in `docs/`. Your real data lives in a separate context library, for example:

```text
context/
├── CONTEXT.md
├── projects/
│   ├── atlas/
│   │   ├── PROJECT.md
│   │   └── decisions/search.md
│   └── beacon/
│       └── PROJECT.md
├── sessions/
│   └── sess_<id>.md
└── sessions.base
```

- **Library index:** `CONTEXT.md` links to project entry points so agents can find relevant context.
- **Project folders:** Each project has its own directory. `PROJECT.md` holds its current state, key decisions, and next steps.
- **Topic documents:** Detailed rationale and verification records live alongside the project notes, linked from the entry point.
- **Session summaries:** Files in `sessions/` reference one or more projects through the `projects` property. The same conversation updates the same file; lists sort by `updated_at`, newest first.
- **Optional view:** `sessions.base` configures an Obsidian view. The records themselves remain in Markdown.

This is an example layout for a new library. Existing project layouts and file names can remain; the current record script uses `sessions/` at the library root. See the [data model — Chinese](docs/data-model.md) for fields and update rules.

## How it fits into your work

Configure the library location and maintenance agreement once, then make ordinary requests:

> Continue Atlas and investigate the mixed-language search issue.

Five skills handle setup, reading, writeback, review, and session records. Agents read relevant context and update notes at meaningful checkpoints, without requiring you to name each skill every time.

This happens while the agent works. The host must discover the skills, load standing instructions, and access local files. See the [usage guide](docs/usage.en.md) for setup.

## Why Markdown

Read and edit your files directly, manage versions with Git, or browse them in Obsidian. The structure stays inspectable, and the knowledge can move with you to other tools that support file access.

The skill package holds the workflow. Your separate context library holds your real data.

## Explore further

- [Usage guide](docs/usage.en.md): installation, automatic maintenance, and the five skills.
- [Data model — Chinese](docs/data-model.md): project documents, session fields, and update rules.
- [Walkthrough — Chinese](examples/walkthrough.md): work across projects and days.
- [Development — Chinese](docs/development.md): repository layout, validation, and contributing.

[MIT License](LICENSE)
