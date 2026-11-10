# CtxKit

**Keep project knowledge in Markdown. Let agents read, update, and record work as they go.**

[中文说明](README.md) · [Standing-instruction template](skills/context-setup/assets/AGENTS.context.template.md) · [Example vault](examples/vault/CONTEXT.md) · [MIT](LICENSE)

CtxKit provides five independently installable Agent Skills for a personal context library. Project notes describe the current state; session work records summarize what one conversation accomplished across projects. Your Markdown files remain readable in an editor or Obsidian.

## Use ordinary requests

The intended workflow is **configure once, then ask for project work normally**:

> Continue Atlas and investigate the mixed-language search issue.

With the skills installed and standing instructions active, the agent should read the relevant project context, perform the task, update project notes at meaningful checkpoints, and update the same session summary. You do not need to name each skill or repeatedly ask it to save.

Two pieces make this work:

- Skills describe when and how to perform each operation. All five explicitly allow implicit invocation in `agents/openai.yaml`.
- Standing instructions provide your library paths and the agreement to read at project entry and write at meaningful checkpoints.

Implicit invocation permits selection; it does not create a scheduler. Actual execution still depends on the host loading the instructions and the model following them. CtxKit does not listen for window closure or crashes, promise fixed-interval saves, or manage the runtime status of chats. See the [official skills documentation](https://learn.chatgpt.com/docs/build-skills).

## Install and configure once

Using Python 3.9+, install into the skills directory your client discovers. This example uses the documented Codex user directory. If you already use another discovered location, keep that location and avoid duplicate installations.

```sh
git clone https://github.com/Zkuns/ctxkit.git
cd ctxkit
python3 scripts/install.py --target "$HOME/.agents/skills" --dry-run
python3 scripts/install.py --target "$HOME/.agents/skills"

# Needed for session records; reuse an existing PyYAML environment if preferred.
python3 -m venv .venv
.venv/bin/python -m pip install -r skills/context-log/requirements.txt
```

The installer refuses existing destinations before copying. It does not install Python dependencies, modify host configuration, or modify your library. Add `--skill context-read` to install just one skill. Codex detects new skills automatically; restart it if they do not appear. Other clients have their own discovery rules.

Fill in the [standing-instruction template](skills/context-setup/assets/AGENTS.context.template.md):

| Placeholder | Value |
| --- | --- |
| `context_root` | Absolute path to your personal context library |
| `context_index` | Absolute path to its existing navigation document |
| `context_python` | Absolute path to a Python executable with PyYAML installed |

These are template placeholders for instructions, not an environment-variable interface. Merge the filled template into instructions the host actually loads, preserving existing rules. The template enables both project updates and session records for relevant registered projects. Remove the session-specific agreement if you only want project notes.

For Codex, use the global `~/.codex/AGENTS.md`, or a repository's `AGENTS.md` for repository-specific scope. Check `CODEX_HOME` and any `AGENTS.override.md` if the rules do not load. Putting the template only inside the library does not make it active. See the [official instruction discovery rules](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

You can ask the agent to do this initial setup in natural language:

```text
Connect my existing context library and enable automatic project reading,
checkpoint updates, and session work summaries.
Library: /absolute/path/to/context
Index: /absolute/path/to/context/CONTEXT.md
Python: /absolute/path/to/ctxkit/.venv/bin/python
Merge the agreement into /absolute/path/to/AGENTS.md and preserve my layout.
```

Start a new conversation and verify which library and maintenance instructions it loaded. After meaningful work, inspect the actual file links it reports. Test on a temporary copy of the fictional example vault first if preferred.

## Skill responsibilities

| Skill | When it applies | Result |
| --- | --- | --- |
| [context-setup](skills/context-setup/SKILL.md) | First setup, connecting existing notes, registering a project, enabling automatic maintenance | Navigation, project entry points, and configured standing instructions when requested |
| [context-read](skills/context-read/SKILL.md) | Starting, continuing, or switching a registered project | Relevant background and next steps; continues the task without writing during reads |
| [context-write](skills/context-write/SKILL.md) | A substantive outcome, confirmed decision, verification result, or new blocker under an active writeback agreement | Incremental updates to current project state and evidence |
| [context-log](skills/context-log/SKILL.md) | Meaningful checkpoints under an active session-record agreement; recent-work queries | A cumulative cross-project summary, or a newest-first list |
| [context-review](skills/context-review/SKILL.md) | Conflicts, broken links, duplication, or excess detail affecting handoff | Scoped findings and, when authorized, local repairs |

A read-only request or “don't record this” takes precedence over ordinary maintenance. Unchanged saves do not refresh timestamps. Documentation edits do not trigger another maintenance cycle. Explicit `$context-read` and similar invocations remain optional ways to select a skill precisely.

The skill instructions, templates, and worked examples are currently in Chinese. [The walkthrough](examples/walkthrough.md) demonstrates ordinary prompts and expected behavior, not measured model performance.

## Repository files and personal data

```text
ctxkit/
  AGENTS.md                         # Guidance for developing this repository
  skills/<skill>/SKILL.md            # Discovery metadata and execution instructions
  skills/<skill>/agents/openai.yaml  # UI metadata and invocation policy
  skills/<skill>/LICENSE             # License for standalone installation
  skills/context-setup/assets/      # Navigation, project, and standing-rule templates
  skills/context-log/scripts/records.py  # save / get / list / view
  skills/context-log/references/cli.md   # Inputs, conflicts, and recovery
  skills/context-log/assets/sessions.base  # Optional Obsidian view
  scripts/install.py                # Explicit destination, no overwrites
  scripts/validate.py               # Package, policy, link, and example checks
  examples/                         # Fictional library and walkthrough
  tests/                            # Script tests and manual behavior scenarios
```

Keep your real library outside the open-source repository:

```text
context/
  CONTEXT.md                        # Navigation, not a duplicate progress log
  projects/
    atlas/
      PROJECT.md                    # Current state, decisions, evidence, next steps
      checks.md                     # Verification scope and results
      decisions/search.md           # Detailed decision rationale and history
    beacon/PROJECT.md
  sessions/
    sess_<stable-id>.md              # One conversation, potentially several projects
  sessions.base                     # Display configuration; contains no record data
```

Project paths and file names are conventions for new libraries. Existing layouts and navigation names are preserved. The bundled record script scans `sessions/*.md` directly under the library root. No action automatically uploads your library to GitHub.

## Project note structure

Project notes answer “what is the state now, and how do I continue?” They normally contain the goal and scope, current state, entry points, important decisions and reasons, evidence, blockers, and next steps. Only retain sections with useful content.

`last_updated` in the [project template](skills/context-setup/assets/PROJECT.template.md) is an edit date, not proof that every claim was revalidated on that date. Project metadata and headings are flexible; existing conventions can remain. Detailed checks and decisions belong in linked topic files rather than repeatedly appended status sections. Template comments should be filled or removed, never treated as project facts.

See the [Chinese guide's annotated examples](README.md) for navigation, project, and session documents.

## Session record structure

A record stores outcomes, necessary reasoning, evidence links, and unfinished work. It does not store the full chat or tool log, and cannot restore the original application's conversation state.

Files created by the script use `sessions/sess_<32 lowercase UUID hex characters>.md`. The name remains stable across dates and title changes. [Example record](examples/vault/sessions/sess_11111111111141118111111111111111.md):

```yaml
# YAML frontmatter above the Markdown body
type: session-record
schema_version: 1
id: sess_11111111111141118111111111111111
title: Search decision and newsletter materials
created_at: '2026-01-14T02:00:00Z'
updated_at: '2026-01-16T09:30:00Z'
projects:
  - '[[projects/atlas/PROJECT]]'
  - '[[projects/beacon/PROJECT]]'
source: example-client
source_session_id: demo-cross-project
```

| Field | Meaning and constraints |
| --- | --- |
| `type` | Required, fixed to `session-record` |
| `schema_version` | Writer emits `1`; reader treats absence as `1` for compatibility |
| `id` | Required stable identifier; generated when first saved |
| `title` | Required nonempty single-line display title |
| `created_at` | Required timezone-aware time when the summary was first created |
| `updated_at` | Required timezone-aware last content-edit time, not before creation; writer uses UTC |
| `projects` | Required list of full library-relative document links, or `[]`; referenced files must exist when saving |
| `source` and `source_session_id` | Optional as a pair; identify the real originating conversation and cannot be reassigned |

The Markdown body must be nonempty. Group cumulative results by project and link to evidence. As it grows, consolidate repetitive process details while preserving meaningful outcomes, decision changes, and unresolved issues.

The same source conversation updates the same record across days and projects. Without a native ID, explicitly create once and retain the returned record ID for later updates. New chats and forks default to new records; do not guess identity from titles or “most recent.” Explicit continuation of an existing record preserves its source identity.

Read the old body and its `revision` before submitting a merged replacement. `revision` is a content-derived concurrency token returned by the CLI, not stored in YAML. Stale updates are rejected. Extra existing YAML properties are preserved; new ID and timestamp values are managed by the script. Manual edits must also maintain `updated_at`.

Write current project notes before recording successful writeback in the session summary. If only some projects were updated, report that precisely. Historical session results must not overwrite newer project state.

## Queries and views

Ask “what have I worked on recently?” or “show Atlas work records.” The script parses `updated_at` and sorts newest first, independent of filenames or filesystem modification times. Metadata appears in lists; `get` includes the body. Default list size is 20, with project, source, and limit filters.

For a manual query of the fictional sample:

```sh
.venv/bin/python skills/context-log/scripts/records.py --root examples/vault list
```

The optional Obsidian `sessions.base` defines columns, filters, and sorting over those Markdown properties. Embed `![[sessions.base#当前项目]]` in a project note to view related records. Custom views are not overwritten. Lists and views can be rebuilt; there is no separate SQLite database to synchronize.

`updated_at` is a summary edit time, not a live running/completed/waiting status. The source ID does not connect to or listen to a chat application. See the [CLI guide](skills/context-log/references/cli.md) for save/get/list/view usage, version conflicts, and local lock recovery.

## Validation and limitations

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python scripts/validate.py
.venv/bin/python -m unittest discover -s tests -v
```

Hosts need local file access and editing capabilities; the session script also needs command execution. Static checks and script tests verify packaging and file behavior, not that every model follows the automatic workflow. Use [behavior scenarios](tests/scenarios.md) in your actual client. The Obsidian view configuration has not been verified through the GUI.

Pulling source updates does not update copied installations. Compare and migrate local edits before replacing installed skill folders; the installer deliberately refuses to overwrite them. Keep other context tools' scopes clear to avoid duplicate updates.

[MIT licensed](LICENSE). Contributions should use small, fictional or sanitized examples.
