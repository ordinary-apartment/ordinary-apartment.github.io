import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('versions', Path(__file__).resolve().parents[1] / 'tools/version-assets.py')
versions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(versions)


class AssetVersionTests(unittest.TestCase):
    def test_changes_invalidate_urls_and_missing_assets_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            html = root / 'index.html'
            html.write_text('<script src="search.js?v=old"></script><link href="styles.css">')
            (root / 'search.js').write_text('first')
            (root / 'styles.css').write_text('body{}')
            first = versions.version_html(root)
            html.write_text(first)
            self.assertEqual(first, versions.version_html(root))
            (root / 'search.js').write_text('second')
            second = versions.version_html(root)
            self.assertNotEqual(first.split('</script>')[0], second.split('</script>')[0])
            self.assertEqual(first.split('</script>')[1], second.split('</script>')[1])
            (root / 'search.js').unlink()
            with self.assertRaises(FileNotFoundError):
                versions.version_html(root)

    def test_entrypoint_versions_all_runtime_assets(self):
        html = versions.version_html(versions.ROOT)
        for name in ('script.js', 'data.js', 'generated/facility-data.js', 'styles.css'):
            self.assertIn(name + '?v=', html)
