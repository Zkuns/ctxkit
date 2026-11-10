import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "install.py"
SPEC = importlib.util.spec_from_file_location("installer", SCRIPT)
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


class InstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.target = Path(self.temp.name) / "带空格的 skills"

    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--target", str(self.target), *args],
            capture_output=True, text=True, check=False,
        )

    def test_dry_run_creates_nothing(self):
        result = self.run_cli("--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.target.exists())

    def test_all_skills_are_copied_completely(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual({p.name for p in self.target.iterdir()}, set(installer.available_skills()))
        for source in installer.SKILLS_ROOT.rglob("*"):
            if source.is_file() and "__pycache__" not in source.parts and source.name != ".DS_Store" and source.suffix != ".pyc":
                self.assertEqual(source.read_bytes(), (self.target / source.relative_to(installer.SKILLS_ROOT)).read_bytes())

    def test_subset_and_duplicate_selection(self):
        result = self.run_cli("--skill", "context-read", "--skill", "context-read")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([p.name for p in self.target.iterdir()], ["context-read"])

    def test_collision_is_detected_before_any_install(self):
        original = self.target / "context-write"
        original.mkdir(parents=True)
        marker = original / "custom.txt"
        marker.write_text("keep my changes", encoding="utf-8")
        result = self.run_cli()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual([p.name for p in self.target.iterdir()], ["context-write"])
        self.assertEqual(marker.read_text(encoding="utf-8"), "keep my changes")

    def test_broken_symlink_is_not_overwritten(self):
        self.target.mkdir()
        existing = self.target / "context-read"
        existing.symlink_to(self.target / "missing")
        result = self.run_cli("--skill", "context-read")
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(existing.is_symlink())

    def test_failed_copy_rolls_back_only_new_destinations(self):
        self.target.mkdir()
        unrelated = self.target / "unrelated.txt"
        unrelated.write_text("keep", encoding="utf-8")
        original_copy = installer.shutil.copytree

        def copy_or_fail(source, destination, *args, **kwargs):
            if Path(source).name == "context-write":
                (Path(destination) / "partial.txt").write_text("incomplete", encoding="utf-8")
                raise OSError("simulated interrupted copy")
            return original_copy(source, destination, *args, **kwargs)

        with patch.object(installer.shutil, "copytree", side_effect=copy_or_fail):
            with self.assertRaises(OSError):
                installer.install(self.target, ["context-read", "context-write"])
        self.assertEqual([p.name for p in self.target.iterdir()], ["unrelated.txt"])
        self.assertEqual(unrelated.read_text(encoding="utf-8"), "keep")

    def test_source_tree_cannot_be_an_install_destination(self):
        with self.assertRaises(ValueError):
            installer.install(installer.SKILLS_ROOT / "nested", ["context-read"], dry_run=True)


if __name__ == "__main__":
    unittest.main()
