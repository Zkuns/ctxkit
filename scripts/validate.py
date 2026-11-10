#!/usr/bin/env python3
"""Validate the distributed skills, UI metadata, and local Markdown links."""

import importlib.util
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

try:
    import yaml
except ImportError:
    sys.exit("Install development dependencies: python3 -m pip install -r requirements-dev.txt")


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {"context-setup", "context-read", "context-write", "context-review", "context-log"}
ERRORS = []


def fail(path, message):
    ERRORS.append(f"{path.relative_to(ROOT)}: {message}")


def read_yaml(path, content):
    try:
        data = yaml.safe_load(content)
    except yaml.YAMLError as error:
        fail(path, f"invalid YAML: {error}")
        return {}
    if not isinstance(data, dict):
        fail(path, "expected a YAML mapping")
        return {}
    return data


def validate_skill(folder):
    path = folder / "SKILL.md"
    if not path.is_file():
        fail(path, "missing SKILL.md")
        return
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\A---\n(.*?)\n---(?:\n|$)", text, re.S)
    if not match:
        fail(path, "missing YAML frontmatter")
        return
    meta = read_yaml(path, match.group(1))
    name = meta.get("name")
    if name != folder.name or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(name)) or len(str(name)) >= 64:
        fail(path, "name must match the folder and use lowercase hyphenated words")
    description = meta.get("description")
    if not isinstance(description, str) or not description.strip() or len(description) > 1024:
        fail(path, "description must contain 1–1024 characters")
    if "[TODO:" in text or "{{" in text:
        fail(path, "unfinished skill scaffold")
    if not (folder / "LICENSE").is_file():
        fail(path, "missing standalone license")
    ui_path = folder / "agents" / "openai.yaml"
    if not ui_path.is_file():
        fail(ui_path, "missing UI metadata")
        return
    metadata = read_yaml(ui_path, ui_path.read_text(encoding="utf-8"))
    ui = metadata.get("interface", {})
    if not isinstance(ui, dict):
        fail(ui_path, "interface must be a mapping")
        return
    for key in ("display_name", "short_description", "default_prompt"):
        if not isinstance(ui.get(key), str) or not ui[key].strip():
            fail(ui_path, f"missing interface.{key}")
    short = ui.get("short_description", "")
    if isinstance(short, str) and not 25 <= len(short) <= 64:
        fail(ui_path, "short_description must contain 25–64 characters")
    prompt = ui.get("default_prompt", "")
    if not isinstance(prompt, str) or f"${folder.name}" not in prompt:
        fail(ui_path, "default_prompt must mention this skill explicitly")


def validate_links(path):
    text = path.read_text(encoding="utf-8")
    # Code examples and parameterized templates are not live file references.
    text = re.sub(r"^```[^\n]*\n.*?^```[ \t]*$", "", text, flags=re.M | re.S)
    for destination in re.findall(r"\[[^\]\n]+\]\(([^)\n]+)\)", text):
        if "{{" in destination:
            continue
        url = urlsplit(destination.strip("<>"))
        if url.scheme or url.netloc or not url.path:
            continue
        target = (path.parent / unquote(url.path)).resolve()
        if not target.exists():
            fail(path, f"broken local link: {destination}")
        if "skills" in path.relative_to(ROOT).parts:
            skill_root = ROOT / "skills" / path.relative_to(ROOT / "skills").parts[0]
            if target != skill_root and skill_root not in target.parents:
                fail(path, f"skill depends on a file outside its own folder: {destination}")


def validate_session_examples():
    script = ROOT / "skills" / "context-log" / "scripts" / "records.py"
    spec = importlib.util.spec_from_file_location("context_records", script)
    records = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(records)
    vault = ROOT / "examples" / "vault"
    try:
        for record in records.scan_records(vault):
            for project in record["meta"]["projects"]:
                records.project_link(project, vault, require_exists=True)
    except (OSError, ValueError, yaml.YAMLError) as error:
        fail(vault / "sessions", str(error))
    asset = ROOT / "skills" / "context-log" / "assets" / "sessions.base"
    example = vault / "sessions.base"
    for path in (asset, example):
        if not path.is_file():
            fail(path, "missing Bases view")
        else:
            read_yaml(path, path.read_text(encoding="utf-8"))
    if asset.is_file() and example.is_file() and asset.read_bytes() != example.read_bytes():
        fail(example, "example view differs from the bundled template")


def main():
    folders = [p for p in (ROOT / "skills").iterdir() if p.is_dir()]
    if {p.name for p in folders} != EXPECTED:
        fail(ROOT / "skills", "unexpected or missing skill folders")
    for folder in folders:
        validate_skill(folder)
    docs = [ROOT / "README.md", ROOT / "README.en.md", ROOT / "AGENTS.md"]
    for directory in ("skills", "examples", "tests"):
        docs.extend((ROOT / directory).rglob("*.md"))
    for path in docs:
        validate_links(path)
    validate_session_examples()
    if ERRORS:
        print("\n".join(ERRORS), file=sys.stderr)
        return 1
    print(f"Validated {len(folders)} skills, links in {len(docs)} Markdown files, and session examples.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
