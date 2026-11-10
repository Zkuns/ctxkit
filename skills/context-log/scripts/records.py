#!/usr/bin/env python3
"""Save and query Markdown session work records. Markdown is the source of truth."""

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import tempfile
from urllib.parse import quote
import uuid

try:
    import yaml
except ImportError:
    sys.exit("Install PyYAML with the requirements.txt bundled in context-log.")


ID_PATTERN = re.compile(r"sess_[0-9a-f]{32}\Z")
FRONTMATTER = re.compile(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|\Z)", re.S)


class RecordError(ValueError):
    pass


class UniqueLoader(yaml.SafeLoader):
    """Do not silently accept duplicate metadata keys."""


def unique_mapping(loader, node, deep=False):
    pairs = loader.construct_pairs(node, deep=deep)
    result = {}
    for key, value in pairs:
        if not isinstance(key, str) or key in result:
            raise RecordError("Metadata keys must be unique strings.")
        result[key] = value
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def utc_now():
    return datetime.now(timezone.utc)


def timestamp(value):
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise RecordError(f"Invalid timestamp: {value}") from error
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise RecordError("Timestamps must include a timezone, such as 2026-01-15T08:00:00Z.")
    return value.astimezone(timezone.utc)


def iso_time(value):
    return timestamp(value).isoformat().replace("+00:00", "Z")


def single_line(value, name):
    if not isinstance(value, str) or not value.strip() or any(c in value for c in "\r\n\x00"):
        raise RecordError(f"{name} must be non-empty, single-line text.")
    return value.strip()


def normalize_body(value):
    if not isinstance(value, str) or not value.strip():
        raise RecordError("body must contain a Markdown work summary.")
    return value.strip() + "\n"


def vault_root(value):
    root = Path(value).expanduser().resolve()
    if not root.is_dir():
        raise RecordError(f"Vault directory does not exist: {root}")
    return root


def records_dir(root):
    directory = root / "sessions"
    if directory.is_symlink() or (directory.exists() and not directory.is_dir()):
        raise RecordError("sessions must be a directory inside the vault, not a symlink or file.")
    return directory


def project_link(value, root, require_exists=False):
    value = single_line(value, "project")
    if value.startswith("[[") and value.endswith("]]"):
        value = value[2:-2]
    value = value.replace("\\", "/")
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ".." in path.parts or any(c in value for c in "|#[]:"):
        raise RecordError("Projects must be vault-relative Markdown paths without aliases or anchors.")
    if path.suffix == ".md":
        path = path.with_suffix("")
    target = root / (path.as_posix() + ".md")
    resolved = target.resolve()
    if root not in resolved.parents:
        raise RecordError("Project reference escapes the vault.")
    if require_exists and not target.is_file():
        raise RecordError(f"Project document does not exist: {target.relative_to(root)}")
    return "[[" + path.as_posix() + "]]"


def normalize_projects(values, root, require_exists=False):
    if not isinstance(values, list):
        raise RecordError("projects must be a list; use [] when no project applies.")
    return sorted({project_link(value, root, require_exists) for value in values})


def source_pair(data):
    source, session_id = data.get("source"), data.get("source_session_id")
    if source is None and session_id is None:
        return None
    return (single_line(source, "source"), single_line(session_id, "source_session_id"))


def read_record(path, root):
    if path.is_symlink():
        raise RecordError(f"Record must not be a symlink: {path.name}")
    raw = path.read_bytes()
    text = raw.decode("utf-8-sig")
    match = FRONTMATTER.match(text)
    if not match:
        if ID_PATTERN.fullmatch(path.stem):
            raise RecordError(f"Missing record metadata: {path.name}")
        return None
    try:
        meta = yaml.load(match.group(1), Loader=UniqueLoader)
    except yaml.YAMLError as error:
        raise RecordError(f"Invalid YAML in {path.name}: {error}") from error
    if not isinstance(meta, dict) or meta.get("type") != "session-record":
        if ID_PATTERN.fullmatch(path.stem):
            raise RecordError(f"Invalid record type: {path.name}")
        return None
    if meta.get("schema_version", 1) != 1:
        raise RecordError(f"Unsupported schema version: {path.name}")
    if not isinstance(meta.get("id"), str) or not ID_PATTERN.fullmatch(meta["id"]):
        raise RecordError(f"Invalid record ID: {path.name}")
    meta["title"] = single_line(meta.get("title"), "title")
    meta["projects"] = normalize_projects(meta.get("projects"), root)
    meta["created_at"] = iso_time(meta.get("created_at"))
    meta["updated_at"] = iso_time(meta.get("updated_at"))
    if timestamp(meta["updated_at"]) < timestamp(meta["created_at"]):
        raise RecordError(f"updated_at precedes created_at: {path.name}")
    pair = source_pair(meta)
    if pair:
        meta["source"], meta["source_session_id"] = pair
    return {"meta": meta, "body": normalize_body(text[match.end():]), "path": path,
            "revision": hashlib.sha256(raw).hexdigest()}


def scan_records(root):
    root = vault_root(root)
    records, ids, sources = [], set(), set()
    for path in sorted(records_dir(root).glob("*.md")):
        record = read_record(path, root)
        if record is None:
            continue
        meta = record["meta"]
        pair = source_pair(meta)
        if meta["id"] in ids or (pair and pair in sources):
            raise RecordError(f"Duplicate record ID or source session: {path.name}")
        ids.add(meta["id"])
        if pair:
            sources.add(pair)
        records.append(record)
    return records


def public_record(record, root, include_body=False):
    result = dict(record["meta"])
    result.update(path=record["path"].relative_to(root).as_posix(), revision=record["revision"])
    if include_body:
        result["body"] = record["body"]
    return result


def get_record(root, record_id=None, source=None, session_id=None):
    root = vault_root(root)
    pair = source_pair({"source": source, "source_session_id": session_id})
    if bool(record_id) == bool(pair):
        raise RecordError("Select a record by --id OR by --source and --source-session-id.")
    for record in scan_records(root):
        if (record_id and record["meta"]["id"] == record_id) or (pair and source_pair(record["meta"]) == pair):
            return public_record(record, root, include_body=True)
    raise RecordError("Record not found.")


def list_records(root, project=None, source=None, session_id=None, limit=20):
    root = vault_root(root)
    if limit < 0:
        raise RecordError("limit must be zero or greater.")
    if session_id and not source:
        raise RecordError("A source session ID also requires --source.")
    project = project_link(project, root) if project else None
    records = [r for r in scan_records(root)
               if (not project or project in r["meta"]["projects"])
               and (not source or r["meta"].get("source") == source)
               and (not session_id or r["meta"].get("source_session_id") == session_id)]
    records.sort(key=lambda r: (timestamp(r["meta"]["updated_at"]), r["meta"]["id"]), reverse=True)
    return [public_record(r, root) for r in records[:limit]]


@contextmanager
def write_lock(root):
    directory = records_dir(root)
    directory.mkdir(exist_ok=True)
    lock = directory / ".context-log.lock"
    try:
        descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as error:
        raise RecordError("Another writer holds sessions/.context-log.lock. Retry after it finishes; see CLI documentation for recovery.") from error
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(json.dumps({"pid": os.getpid(), "created_at": iso_time(utc_now())}))
        yield
    finally:
        lock.unlink()


def atomic_write(path, text):
    descriptor, temporary = tempfile.mkstemp(prefix=".record-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        if path.exists():
            os.chmod(temporary, stat.S_IMODE(path.stat().st_mode))
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def save_record(root, data, record_id=None, new=False, if_match=None):
    root = vault_root(root)
    if not isinstance(data, dict):
        raise RecordError("Input must be a JSON object.")
    unknown = set(data) - {"title", "projects", "body", "source", "source_session_id"}
    if unknown:
        raise RecordError(f"Unsupported input fields: {', '.join(sorted(unknown))}")
    title = single_line(data.get("title"), "title")
    projects = normalize_projects(data.get("projects"), root, require_exists=True)
    body, pair = normalize_body(data.get("body")), source_pair(data)
    if new and record_id:
        raise RecordError("--new cannot be combined with --id.")
    if not record_id and not pair and not new:
        raise RecordError("Provide source identity, an existing --id, or --new for the first record.")
    with write_lock(root):
        records = scan_records(root)
        by_id = next((r for r in records if r["meta"]["id"] == record_id), None) if record_id else None
        by_source = next((r for r in records if source_pair(r["meta"]) == pair), None) if pair else None
        if record_id and by_id is None:
            raise RecordError("Record ID not found; IDs cannot create new records.")
        if by_id and by_source and by_id is not by_source:
            raise RecordError("This source session already belongs to another record.")
        existing = by_id or by_source
        if new and existing:
            raise RecordError("This source session already has a record. Read and update it.")
        if existing:
            old_pair = source_pair(existing["meta"])
            if pair and old_pair and pair != old_pair:
                raise RecordError("An existing source session identity cannot be changed.")
            if if_match is not None and if_match != existing["revision"]:
                raise RecordError("Record changed since it was read. Read it again and merge before saving.")
            pair = pair or old_pair
            unchanged = (title == existing["meta"]["title"] and projects == existing["meta"]["projects"]
                         and body == existing["body"] and pair == old_pair)
            if unchanged:
                return {**public_record(existing, root), "changed": False}
            if if_match is None:
                raise RecordError("Updating a record requires --if-match from a fresh get result.")
        elif if_match is not None:
            raise RecordError("--if-match refers to an existing record; no matching record was found.")
        now = iso_time(utc_now())
        if existing:
            meta = dict(existing["meta"])
            path = existing["path"]
            if timestamp(now) < timestamp(meta["updated_at"]):
                raise RecordError("Clock is earlier than the record update time; check the timestamp before saving.")
        else:
            meta = {"type": "session-record", "schema_version": 1,
                    "id": "sess_" + uuid.uuid4().hex, "created_at": now}
            path = records_dir(root) / (meta["id"] + ".md")
            if path.exists() or path.is_symlink():
                raise RecordError("Record filename collision; retry with a new generated ID.")
        meta.update(title=title, projects=projects, updated_at=now)
        if pair:
            meta["source"], meta["source_session_id"] = pair
        text = "---\n" + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False) + "---\n\n" + body
        if existing and hashlib.sha256(path.read_bytes()).hexdigest() != existing["revision"]:
            raise RecordError("Record changed while saving. Read it again and merge.")
        atomic_write(path, text)
        return {**public_record(read_record(path, root), root), "changed": True}


def install_view(root):
    root = vault_root(root)
    path = root / "sessions.base"
    text = (Path(__file__).resolve().parents[1] / "assets" / "sessions.base").read_text(encoding="utf-8")
    if path.is_symlink():
        raise RecordError("Refusing to replace a symlink at sessions.base.")
    if path.exists():
        if path.read_text(encoding="utf-8") == text:
            return {"path": "sessions.base", "changed": False}
        raise RecordError("sessions.base already exists with different content; preserve your custom view.")
    with path.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
    return {"path": "sessions.base", "changed": True}


def markdown_list(records):
    def escape(value):
        return str(value).replace("\\", "\\\\").replace("|", "\\|").replace("[", "\\[").replace("]", "\\]")
    lines = ["| 工作记录 | 关联项目 | 更新时间（UTC） |", "| --- | --- | --- |"]
    for record in records:
        projects = ", ".join(escape(p[2:-2]) for p in record["projects"])
        lines.append(f"| [{escape(record['title'])}]({quote(record['path'], safe='/')}) | {projects} | {record['updated_at']} |")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, help="Existing Markdown vault directory")
    commands = parser.add_subparsers(dest="command", required=True)
    save = commands.add_parser("save", help="Create or replace a work summary, preserving identity")
    save.add_argument("--input", required=True, help="JSON payload file, or - for stdin")
    save.add_argument("--id", help="Existing record ID")
    save.add_argument("--new", action="store_true", help="Explicitly create when no source session ID is available")
    save.add_argument("--if-match", help="Revision from get; required for changed existing records")
    get = commands.add_parser("get", help="Read metadata, body, and revision")
    get.add_argument("--id")
    get.add_argument("--source")
    get.add_argument("--source-session-id")
    listing = commands.add_parser("list", help="List records newest-first without modifying them")
    listing.add_argument("--project", help="Vault-relative project document or full wikilink")
    listing.add_argument("--source")
    listing.add_argument("--source-session-id")
    listing.add_argument("--limit", type=int, default=20)
    listing.add_argument("--format", choices=("json", "markdown"), default="markdown")
    commands.add_parser("view", help="Add the optional Obsidian Bases view without replacing customizations")
    args = parser.parse_args()
    try:
        if args.command == "save":
            payload = sys.stdin.read() if args.input == "-" else Path(args.input).read_text(encoding="utf-8")
            result = save_record(args.root, json.loads(payload), args.id, args.new, args.if_match)
        elif args.command == "get":
            result = get_record(args.root, args.id, args.source, args.source_session_id)
        elif args.command == "list":
            result = list_records(args.root, args.project, args.source, args.source_session_id, args.limit)
            if args.format == "markdown":
                print(markdown_list(result))
                return 0
        else:
            result = install_view(args.root)
        print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
        return 0
    except (OSError, UnicodeError, ValueError, yaml.YAMLError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
