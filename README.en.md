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

**Choose storage directly in Context Library.** Open the sidebar page, click **Choose directory**, and confirm an existing folder in the macOS system chooser. No environment variables, path-configuration form or separate Save button.

**Confirmation opts the current working directory into new-work capture**, using each session’s selected model for additional summarization calls. The scope and model policy are shown before confirmation. Other and nested workspaces are not implicitly authorized. Cancelling changes nothing; existing files and historical chats are not moved or imported, and session file permissions remain unchanged.

**Users need not mention CtxKit or ask to search memory.** The agent can proactively retrieve relevant prior work when a normal task depends on history. For manual browsing, open **Context Library** in the DSH sidebar: use **Open in Finder** to view and manage Markdown files, or search captured session dossiers in the separate **Sessions** tab.

This is a **0.6 MVP**, providing native folder-based onboarding, direct Finder access, separate session search and a direct proactive-recall tool. Completed turns remain candidate checkpoints, with no shutdown-save guarantee. Retrieval is lexical; deciding when to recall and judging historical claims still require model judgment and current evidence. See the [full plugin guide](plugins/dsh/docs/TECHNICAL.md) for capture authorization and limits.

## Development

```sh
npm --prefix plugins/dsh install --ignore-scripts
node --test plugins/dsh/tests/*.test.js
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

Tests use fictional material in isolated temporary directories. See [development notes (Chinese)](docs/development.md).

## Earlier skill prototype

The root `skills/` directory and [earlier usage guide](docs/usage.en.md) retain the original Codex / Claude Code project-context prototype. Its data model is separate from the new plugin. These skills remain independently usable, but do not provide the plugin's automatic capture, and are not migrated into a new vault automatically.

[MIT License](LICENSE)
