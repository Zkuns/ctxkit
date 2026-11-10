# CtxKit

**Keep project knowledge useful across AI conversations.**

[中文说明](README.md) · [Example vault](examples/vault/CONTEXT.md) · [MIT License](LICENSE)

Five independently installable Agent Skills for a personal Markdown project
knowledge base. Read the relevant context before working, record confirmed
outcomes afterward, and keep project notes usable for the next conversation.

| Skill | Purpose |
| --- | --- |
| [context-setup](skills/context-setup/SKILL.md) | Create a vault or connect an existing one; register project entry points |
| [context-read](skills/context-read/SKILL.md) | Load only the project context needed for the current task |
| [context-write](skills/context-write/SKILL.md) | Update progress, decisions, evidence, and next steps in place |
| [context-review](skills/context-review/SKILL.md) | Find conflicting status, broken links, duplication, and stale claims |
| [context-log](skills/context-log/SKILL.md) | Record what a conversation accomplished across projects; query recent work |

Skill instructions and example content are currently in Chinese. The skills use
the `SKILL.md` format and include optional Codex UI metadata. They need a host
with local file access; editing workflows also require write access. Host-specific
discovery and execution behavior must be verified in the client you use.

## Install

From a downloaded or cloned copy of this repository, using Python 3.9+:

```sh
git clone https://github.com/Zkuns/ctxkit.git
cd ctxkit

python3 scripts/install.py --target "$HOME/.codex/skills" --dry-run
python3 scripts/install.py --target "$HOME/.codex/skills"
```

Use your client's configured skills directory as the target. Add
`--skill context-read` to install a single skill. The installer refuses existing
destinations and does not change host configuration or your knowledge base.

The optional `context-log` script needs PyYAML. Install its bundled
`requirements.txt` in a virtual environment; the skill installer does not install
Python dependencies. The other four skills use the host's file tools directly.

Tell the agent where your vault and its index live. You can put that instruction
in your host's project instructions, or provide `CONTEXT_ROOT` to the host process.
Explicit paths in the current request take priority over existing instructions
and environment configuration. Existing vault layouts are preserved.

## Use

```text
Use context-read to pick up work on Atlas from my project context library.

Use context-write to save the verified changes and next steps to Atlas.
The local checks passed; deployment has not happened.

Use context-review to check Atlas for contradictory status and broken links.

Use context-log to record what this conversation accomplished in Atlas and Beacon.
Update the existing record for this conversation if there is one.
```

The project entry point keeps the current state. Topic documents hold details
when needed. Plans, implementation, verification, and deployment remain distinct.
Historical commands and unfinished tasks are reference material, not new
authorization to execute them.

## Session work records

Project notes describe the current state; session work records describe what a
conversation accomplished. Each record is a Markdown file with a stable ID,
title, creation/update timestamps, project links, and optional source identity.
One conversation can span several days and projects without renaming its file.

The bundled script resolves source identities, preserves unchanged records,
requires a fresh revision before replacing an existing summary, and lists records
by timezone-aware `updated_at` in descending order. Only metadata is included in
list output; `get` returns the body. Manual edits must also maintain `updated_at`.

An optional Obsidian Bases view uses the same properties. Markdown remains the
source of truth; generated lists and views are disposable. No SQLite database or
full conversation transcript collection is involved.

See the [CLI guide](skills/context-log/references/cli.md) for record input,
queries, revision conflicts, and local write-lock recovery. View configuration is
provided for inspection and must be verified in your Obsidian version.

Installing skills does not start background work, scheduling, or synchronization.
All sample projects, sessions, and validation results are fictional.

See the [Chinese guide](README.md) for setup, ongoing writeback instructions,
validation commands, and contribution guidance.
