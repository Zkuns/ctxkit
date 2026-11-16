# Working on CtxKit

Read README.md before editing, then docs/development.md for repository structure
and checks. The current direction is a DSH-first automatic context library; read
docs/dsh-design.md and plugins/dsh/README.md for its contracts and explicit limits.
The root skills/, fictional vault, and Python installer are an earlier independent
prototype, not compatibility constraints on the new plugin.

- Keep each distributed root skill independently installable. It must not depend
  on a sibling skill, a personal filesystem path, or an unbundled reference.
  Generated topic skills are inert drafts, not automatically installed packages.
- Plugin capture must be opt-in by vault, workspace and model, and respect the
  current session's file policy at every publication. Use the DSH native writer.
  Source text is bounded/in-memory; persisted tasks contain references, not raw
  transcripts. Disposal, pauses and failures must never be reported as success.
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
- Keep natural-language work as the default. The DSH plugin observes opted-in
  new turns; legacy skills rely on standing instructions. Neither implicit skill
  selection nor a turn-end listener guarantees persistence before shutdown.
  Report mocked, native-backend, live-host and real-model verification separately.
- Run the package validator after changing skills or metadata. When changing
  the installer, run its tests in temporary directories; do not install into a
  real user's skill directory as a test.

Validation:

```sh
node --test plugins/dsh/tests/*.test.js
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
```
