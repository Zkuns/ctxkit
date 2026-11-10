# Working on CtxKit

Read README.md before editing. This repository contains reusable project-level
context skills, a fictional example vault, and installation tooling.

- Keep each skill independently installable. It must not depend on a sibling
  skill, a personal filesystem path, or an unbundled reference.
- Keep the common workflow in SKILL.md; add supporting resources only when they
  materially help the task. Preserve the distinction between reading, recording,
  and executing project work.
- Use fictional examples. Never copy the maintainer's real vault, chat logs,
  credentials, account details, or private project documents into this repo.
- Preserve existing vault layouts. Session records summarize work across
  projects; do not capture full chat transcripts or introduce a daemon,
  an agent framework, or automatic remote publishing.
- Markdown records are authoritative. Lists and Bases views are derived; no
  database is required. Preserve stable IDs and timestamps on unchanged saves.
- Keep natural-language use and checkpoint maintenance as the documented default
  once standing instructions are configured. Implicit skill selection is not a
  scheduler or a guaranteed shutdown hook; report those limits accurately.
- Run the package validator after changing skills or metadata. When changing
  the installer, run its tests in temporary directories; do not install into a
  real user's skill directory as a test.

Validation:

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
```
