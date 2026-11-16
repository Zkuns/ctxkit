import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validator", ROOT / "scripts" / "validate.py")
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class ValidationDiscoveryTests(unittest.TestCase):
    def test_authored_docs_include_nested_plugins_but_exclude_installed_dependencies(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            included = {"README.md", "dsh/README.md", "dsh/docs/config.md"}
            excluded = {"dsh/node_modules/example/README.md", "node_modules/deep/nested.md", ".venv/lib/example.md", ".git/example.md"}
            for name in included | excluded:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("[fixture](missing-target.md)", encoding="utf-8")
            found = {path.relative_to(root).as_posix() for path in validator.repository_markdown(root)}
            self.assertEqual(found, included)


if __name__ == "__main__":
    unittest.main()
