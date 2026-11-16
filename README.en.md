# CtxKit

Work normally in AI sessions. Let useful outcomes grow into a context library you own.

[中文](README.md) · [DSH plugin](plugins/dsh/README.md) · [Design and contracts (Chinese)](docs/dsh-design.md)

## A growing knowledge and capability space

A topic is not necessarily a code project. It may be a product, an ongoing activity, a technical subject, or a reusable working method. Start with an overview, then grow detailed documents and procedure drafts only when the work justifies them.

```text
context/
├── INDEX.md
├── topics/topic_atlas/
│   ├── OVERVIEW.md
│   ├── docs/
│   │   ├── architecture.md
│   │   └── authentication.md
│   └── skills/deploy/SKILL.md
└── sessions/session_<id>/
    ├── SESSION.md
    └── checkpoints/cp_<id>.md
```

The overview is a task-oriented index. Documents explain current knowledge, decisions, constraints and evidence. Topic skills are inert procedure drafts, not installed capabilities or execution permission. Session records explain what happened and where work stopped; their checkpoints provide sources for topic updates. One session can contribute to multiple topics.

Current understanding and historical work are distinct. Planned actions, implementation, observed checks, user reports and inferences must not be conflated.

## DSH first

The new implementation lives in [plugins/dsh](plugins/dsh/README.md) and does not depend on the five original skills.

The first version provides automatic checkpoint extraction, topic/document organization, evidenced relationships, inert skill drafts, and on-demand search/read tools. Markdown is authoritative, with no vector database or extra Python runtime. Writes respect the current session's file policy, detect stale revisions and retain recoverable processing state.

**Capture is inactive by default.** Configure an existing vault, explicitly allowed workspaces and a summarization model before enabling. Installation does not scan all historical conversations or authorize deployment, publishing or generated skill installation.

This is a **0.1 MVP**. Completed turns are candidate checkpoints; the model can skip insignificant ones. There is no shutdown-save guarantee. Search is lexical, and factual quality still needs model/user evaluation. See the [plugin guide](plugins/dsh/README.md) for configuration and limits.

## Development

```sh
node --test plugins/dsh/tests/*.test.js
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

Tests use fictional material in isolated temporary directories. See [development notes (Chinese)](docs/development.md).

## Earlier skill prototype

The root `skills/` directory and [earlier usage guide](docs/usage.en.md) retain the original Codex / Claude Code project-context prototype. Its data model is separate from the new plugin. These skills remain independently usable, but do not provide the plugin's automatic capture, and are not migrated into a new vault automatically.

[MIT License](LICENSE)
