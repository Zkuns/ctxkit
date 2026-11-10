import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import yaml


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "context-log" / "scripts" / "records.py"
SPEC = importlib.util.spec_from_file_location("records", SCRIPT)
records = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(records)


class RecordTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.vault = Path(self.temp.name) / "上下文 库"
        for project in ("atlas", "beacon", "中文 项目"):
            path = self.vault / "projects" / project / "PROJECT.md"
            path.parent.mkdir(parents=True)
            path.write_text(f"# {project}\n", encoding="utf-8")
        self.payload = {
            "title": "搜索与周报",
            "projects": ["projects/atlas/PROJECT.md", "projects/beacon/PROJECT.md"],
            "source": "example-client",
            "source_session_id": "example-session",
            "body": "# 工作摘要\n\n## Atlas\n- 确认方案，尚未实施。\n",
        }

    def save(self, payload=None, when="2026-01-18T08:00:00Z", **kwargs):
        with patch.object(records, "utc_now", return_value=records.timestamp(when)):
            return records.save_record(self.vault, self.payload if payload is None else payload, **kwargs)

    def rewrite_metadata(self, result, **updates):
        path = self.vault / result["path"]
        text = path.read_text(encoding="utf-8")
        match = records.FRONTMATTER.match(text)
        meta = yaml.safe_load(match.group(1))
        meta.update(updates)
        path.write_text("---\n" + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False)
                        + "---\n" + text[match.end():], encoding="utf-8")

    def cli(self, *args, payload=None, script=SCRIPT):
        return subprocess.run(
            [sys.executable, str(script), "--root", str(self.vault), *args],
            input=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
            capture_output=True, text=True, check=False,
        )

    def test_cross_day_update_keeps_identity_and_prior_work(self):
        first = self.save()
        merged = {**self.payload, "title": "搜索方案和周报进展",
                  "body": self.payload["body"] + "\n## Beacon\n- 整理素材，待补数据。\n"}
        updated = self.save(merged, when="2026-01-21T08:00:00Z", if_match=first["revision"])
        for key in ("id", "path", "created_at"):
            self.assertEqual(updated[key], first[key])
        self.assertEqual(updated["updated_at"], "2026-01-21T08:00:00Z")
        self.assertEqual(len(list((self.vault / "sessions").glob("*.md"))), 1)
        loaded = records.get_record(self.vault, source="example-client", session_id="example-session")
        self.assertIn("确认方案", loaded["body"])
        self.assertIn("整理素材", loaded["body"])
        for project in self.payload["projects"]:
            self.assertEqual(records.list_records(self.vault, project=project)[0]["id"], first["id"])

    def test_unchanged_save_preserves_bytes_mtime_and_update_time(self):
        first = self.save()
        path = self.vault / first["path"]
        before = path.read_bytes(), path.stat().st_mtime_ns
        equivalent = {**self.payload, "projects": list(reversed(self.payload["projects"]))
                      + ["[[projects/atlas/PROJECT]]"]}
        result = self.save(equivalent, when="2026-01-25T08:00:00Z")
        self.assertFalse(result["changed"])
        self.assertEqual(result["updated_at"], first["updated_at"])
        self.assertEqual((path.read_bytes(), path.stat().st_mtime_ns), before)

    def test_changed_save_requires_current_revision(self):
        first = self.save()
        changed = {**self.payload, "body": "# 新阶段\n\n- 尚未验证。"}
        with self.assertRaisesRegex(records.RecordError, "requires --if-match"):
            self.save(changed)
        updated = self.save(changed, when="2026-01-19T08:00:00Z", if_match=first["revision"])
        with self.assertRaisesRegex(records.RecordError, "changed since"):
            self.save(self.payload, if_match=first["revision"])
        self.assertEqual(records.get_record(self.vault, record_id=first["id"])["revision"], updated["revision"])
        # A stale writer must not succeed even if its content happens to match.
        with self.assertRaisesRegex(records.RecordError, "changed since"):
            self.save(changed, if_match=first["revision"])

    def test_external_edit_is_not_overwritten_and_custom_properties_survive(self):
        first = self.save()
        self.rewrite_metadata(first, tags=["reviewed"])
        changed = {**self.payload, "title": "更清晰的标题"}
        with self.assertRaisesRegex(records.RecordError, "changed since"):
            self.save(changed, if_match=first["revision"])
        fresh = records.get_record(self.vault, record_id=first["id"])
        result = self.save(changed, if_match=fresh["revision"])
        self.assertEqual(result["tags"], ["reviewed"])

    def test_no_native_id_requires_explicit_creation_and_reusable_record_id(self):
        payload = {key: self.payload[key] for key in ("title", "projects", "body")}
        with self.assertRaisesRegex(records.RecordError, "--new"):
            self.save(payload)
        first = self.save(payload, new=True)
        second = self.save(payload, new=True)
        self.assertNotEqual(first["id"], second["id"])
        updated = self.save({**payload, "body": "# 补充阶段成果"}, record_id=first["id"],
                            if_match=first["revision"])
        self.assertEqual(updated["id"], first["id"])
        self.assertEqual(len(records.list_records(self.vault)), 2)

    def test_source_identity_cannot_be_reassigned_or_created_twice(self):
        first = self.save()
        with self.assertRaisesRegex(records.RecordError, "already has a record"):
            self.save(new=True)
        with self.assertRaisesRegex(records.RecordError, "cannot be changed"):
            self.save({**self.payload, "source_session_id": "different-session"},
                      record_id=first["id"], if_match=first["revision"])
        # Different platforms can have identical native IDs without collision.
        other = self.save({**self.payload, "source": "other-client"})
        self.assertNotEqual(first["id"], other["id"])
        with self.assertRaisesRegex(records.RecordError, "another record"):
            self.save(self.payload, record_id=other["id"], if_match=other["revision"])

    def test_explicit_continuation_preserves_old_source_when_omitted(self):
        first = self.save()
        payload = {key: self.payload[key] for key in ("title", "projects", "body")}
        payload["body"] += "\n- 在后续会话完成补充。\n"
        result = self.save(payload, record_id=first["id"], if_match=first["revision"])
        self.assertEqual(result["source_session_id"], "example-session")

    def test_sort_uses_timezone_aware_metadata_not_file_mtime(self):
        first = self.save()
        second = self.save({**self.payload, "source_session_id": "second"})
        self.rewrite_metadata(first, updated_at="2026-01-20T12:00:00+08:00")
        self.rewrite_metadata(second, updated_at="2026-01-20T05:00:00Z")
        os.utime(self.vault / first["path"], (2000000000, 2000000000))
        os.utime(self.vault / second["path"], (1000000000, 1000000000))
        listed = records.list_records(self.vault)
        self.assertEqual([r["id"] for r in listed], [second["id"], first["id"]])
        self.assertNotIn("body", listed[0])
        self.assertEqual(len(records.list_records(self.vault, limit=1)), 1)
        self.assertEqual(records.list_records(self.vault, limit=0), [])

    def test_queries_do_not_create_files_or_change_records(self):
        self.assertEqual(records.list_records(self.vault), [])
        self.assertFalse((self.vault / "sessions").exists())
        first = self.save()
        path = self.vault / first["path"]
        before = path.read_bytes(), path.stat().st_mtime_ns
        records.get_record(self.vault, record_id=first["id"])
        records.list_records(self.vault)
        self.assertEqual((path.read_bytes(), path.stat().st_mtime_ns), before)

    def test_invalid_input_does_not_create_records(self):
        invalid = [
            {**self.payload, "projects": ["../outside.md"]},
            {**self.payload, "projects": ["projects/missing/PROJECT.md"]},
            {**self.payload, "projects": "atlas"},
            {**self.payload, "source_session_id": None},
            {**self.payload, "updated_at": "2026-01-01T00:00:00Z"},
            {**self.payload, "body": " "},
        ]
        for payload in invalid:
            with self.subTest(payload=payload), self.assertRaises(records.RecordError):
                self.save(payload)
        self.assertFalse((self.vault / "sessions").exists())
        result = self.save({**self.payload, "projects": ["projects/中文 项目/PROJECT.md"]})
        self.assertEqual(result["projects"], ["[[projects/中文 项目/PROJECT]]"])

    def test_duplicate_record_or_source_is_reported(self):
        first = self.save()
        duplicate = self.vault / "sessions" / "copy.md"
        duplicate.write_bytes((self.vault / first["path"]).read_bytes())
        with self.assertRaisesRegex(records.RecordError, "Duplicate"):
            records.list_records(self.vault)
        self.rewrite_metadata({"path": "sessions/copy.md"}, id="sess_" + "a" * 32)
        with self.assertRaisesRegex(records.RecordError, "Duplicate"):
            self.save()

    def test_invalid_timestamp_or_duplicate_metadata_is_reported(self):
        first = self.save()
        self.rewrite_metadata(first, updated_at="2026-01-20T08:00:00")
        with self.assertRaisesRegex(records.RecordError, "timezone"):
            records.list_records(self.vault)
        self.rewrite_metadata(first, updated_at="2026-01-20T08:00:00Z")
        path = self.vault / first["path"]
        path.write_text(path.read_text(encoding="utf-8").replace("---\n", "---\ntitle: duplicate\n", 1),
                        encoding="utf-8")
        with self.assertRaisesRegex(records.RecordError, "unique"):
            records.list_records(self.vault)

    def test_busy_lock_and_failed_replace_preserve_record(self):
        first = self.save()
        path = self.vault / first["path"]
        before = path.read_bytes()
        with records.write_lock(self.vault):
            with self.assertRaisesRegex(records.RecordError, "Another writer"):
                self.save()
        changed = {**self.payload, "title": "新标题"}
        with patch.object(records.os, "replace", side_effect=OSError("simulated failure")):
            with self.assertRaises(OSError):
                self.save(changed, if_match=first["revision"])
        self.assertEqual(path.read_bytes(), before)
        self.assertEqual(list(path.parent.glob(".record-*.tmp")), [])
        self.assertFalse((path.parent / ".context-log.lock").exists())

    def test_backwards_clock_is_reported_without_modifying_record(self):
        first = self.save()
        with self.assertRaisesRegex(records.RecordError, "Clock"):
            self.save({**self.payload, "title": "新标题"}, when="2026-01-17T00:00:00Z",
                      if_match=first["revision"])
        self.assertEqual(records.get_record(self.vault, record_id=first["id"])["revision"], first["revision"])

    def test_custom_view_is_preserved_and_can_be_rebuilt(self):
        first = self.save()
        self.assertTrue(records.install_view(self.vault)["changed"])
        self.assertFalse(records.install_view(self.vault)["changed"])
        path = self.vault / "sessions.base"
        path.write_text("views: []\n", encoding="utf-8")
        with self.assertRaisesRegex(records.RecordError, "custom view"):
            records.install_view(self.vault)
        self.assertEqual(path.read_text(encoding="utf-8"), "views: []\n")
        path.unlink()
        records.install_view(self.vault)
        self.assertEqual(records.get_record(self.vault, record_id=first["id"])["revision"], first["revision"])

    def test_cli_round_trip_with_unicode_paths_and_stdin(self):
        saved = self.cli("save", "--input", "-", payload=self.payload)
        self.assertEqual(saved.returncode, 0, saved.stderr)
        first = json.loads(saved.stdout)
        got = self.cli("get", "--id", first["id"])
        self.assertEqual(got.returncode, 0, got.stderr)
        fresh = json.loads(got.stdout)
        changed = {**self.payload, "body": fresh["body"] + "\n- 完成下一阶段。"}
        saved = self.cli("save", "--input", "-", "--if-match", fresh["revision"], payload=changed)
        self.assertEqual(saved.returncode, 0, saved.stderr)
        listed = self.cli("list", "--project", "projects/atlas/PROJECT.md", "--format", "json")
        self.assertEqual(listed.returncode, 0, listed.stderr)
        self.assertEqual(json.loads(listed.stdout)[0]["id"], first["id"])
        invalid = self.cli("save", "--input", "-", payload={"body": "incomplete"})
        self.assertNotEqual(invalid.returncode, 0)
        self.assertNotIn("Traceback", invalid.stderr)

    def test_installed_skill_runs_without_sibling_skills(self):
        target = Path(self.temp.name) / "独立 skills"
        installed = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "install.py"), "--target", str(target),
             "--skill", "context-log"], capture_output=True, text=True, check=False,
        )
        self.assertEqual(installed.returncode, 0, installed.stderr)
        script = target / "context-log" / "scripts" / "records.py"
        saved = self.cli("save", "--input", "-", payload=self.payload, script=script)
        self.assertEqual(saved.returncode, 0, saved.stderr)
        view = self.cli("view", script=script)
        self.assertEqual(view.returncode, 0, view.stderr)
        self.assertTrue((self.vault / "sessions.base").is_file())
        self.assertEqual({p.name for p in target.iterdir()}, {"context-log"})


if __name__ == "__main__":
    unittest.main()
