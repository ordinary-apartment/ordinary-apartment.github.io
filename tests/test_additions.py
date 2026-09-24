import copy
import csv
import importlib.util
from pathlib import Path
import tempfile
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('additions', ROOT/'tools/check-additions.py')
additions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(additions)
link_spec = importlib.util.spec_from_file_location('linkchecker', ROOT/'tools/check-links.py')
linkchecker = importlib.util.module_from_spec(link_spec)
link_spec.loader.exec_module(linkchecker)


class AdditionTests(unittest.TestCase):
    def test_regional_cultural_facilities_material_is_populated_and_unique(self):
        path = ROOT/'data/地域文化施設.csv'
        with path.open(encoding='utf-8-sig', newline='') as handle:
            rows = list(csv.DictReader(handle))
        self.assertGreaterEqual(len(rows), 20)
        names = [row['店舗名・施設名'].strip() for row in rows]
        self.assertEqual(len(names), len(set(names)))
        self.assertTrue(all(row['説明・狙い目'].strip() for row in rows))
        self.assertGreaterEqual(len({row['都道府県'] for row in rows}), 20)

    def test_link_checker_fetches_page_and_rejects_redirect_without_context(self):
        class Headers:
            def get_content_type(self): return 'text/html'
            def get_content_charset(self): return 'utf-8'
        class Response:
            status = 200
            headers = Headers()
            def __init__(self, body, final_url): self.body, self.final_url = body, final_url
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def geturl(self): return self.final_url
            def read(self, _size): return self.body
        good = Response('<html><title>桐ヶ丘中央商店街</title><body>記録</body></html>'.encode(), 'https://example.test/good')
        home = Response('<html><title>ホーム</title><body>別の情報</body></html>'.encode(), 'https://example.test/home')
        with patch.object(linkchecker, 'urlopen', side_effect=[good, home]):
            self.assertTrue(linkchecker.check_url('https://example.test/good', '桐ヶ丘中央商店街', 2)[0])
            self.assertFalse(linkchecker.check_url('https://example.test/redirect', '桐ヶ丘中央商店街', 2)[0])

    def test_link_checker_detects_official_related_url_overlap(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'資料.csv'
            path.write_text(
                '店舗名・施設名,公式サイト,関連リンク1タイトル,関連リンク1URL\n'
                '施設,https://example.test/official/,解説,https://EXAMPLE.test/official#top\n',
                encoding='utf-8')
            overlaps = list(linkchecker.iter_official_overlaps(path, 1))
            self.assertEqual(len(overlaps), 1)
            self.assertIn('URL正規化後', overlaps[0][3])

    def test_link_checker_supports_third_survey_candidate_schema(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'第三次候補.csv'
            path.write_text(
                '名称,公式情報URL,関連リンクタイトル1,関連リンクURL1\n'
                '竹見台近隣センター,https://example.test/official,訪問記,https://example.test/report\n',
                encoding='utf-8')
            links = list(linkchecker.iter_links(path))
            self.assertEqual([(x[1], x[2], x[4]) for x in links], [
                ('竹見台近隣センター', 0, 'https://example.test/official'),
                ('竹見台近隣センター', 1, 'https://example.test/report'),
            ])

    def test_candidate_schema_official_overlap_is_checked(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'第三次候補.csv'
            path.write_text(
                '名称,公式情報URL,関連リンクタイトル1,関連リンクURL1\n'
                '施設,https://example.test/official/,解説,https://EXAMPLE.test/official#top\n',
                encoding='utf-8')
            overlaps = list(linkchecker.iter_official_overlaps(path, 1))
            self.assertEqual(len(overlaps), 1)

    def test_duplicate_names_normalize_width_space_and_case(self):
        self.assertTrue(additions.duplicate_reasons({'name': 'Ａ BC　館'}, {'name': 'abc館'}))
        self.assertTrue(additions.duplicate_reasons({'name': '施設 本館'}, {'name': '施設'}))
        self.assertTrue(additions.duplicate_reasons(
            {'name': '旧名', 'official': 'https://example.com/a/'},
            {'name': '新名', 'official': 'https://example.com/a'}))
        self.assertFalse(additions.duplicate_reasons({'name': '図書館'}, {'name': '温室'}))

    def test_duplicates_include_other_materials_and_candidate_batch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'data').mkdir()
            (root/'data/資料.csv').write_text('施設名\n既存\n', encoding='utf-8')
            candidate = root/'候補.csv'
            candidate.write_text('施設名\n既存\n新規\n新規\n', encoding='utf-8')
            before = candidate.read_bytes()
            result = additions.duplicates(root, candidate)
            self.assertEqual([r['candidateRow'] for r in result], [1, 3])
            self.assertEqual(candidate.read_bytes(), before)

    def test_append_guard_checks_all_fields_and_order(self):
        old = {'schemaVersion': 2, 'materials': [
            {'id': 'a', 'number': 1, 'name': '資料', 'shortName': '資料', 'file': '資料.csv',
             'items': [{'name': '一', 'note': '保存'}, {'name': '二', 'extra': {'独自': '値'}}]}]}
        new = copy.deepcopy(old)
        new['materials'][0]['items'].append({'name': '三'})
        additions.assert_catalog_append_only(old, new)
        for mutation in ('delete', 'edit', 'reorder', 'identity', 'material'):
            broken = copy.deepcopy(old)
            material = broken['materials'][0]
            if mutation == 'delete': material['items'].pop()
            if mutation == 'edit': material['items'][0]['note'] = '変更'
            if mutation == 'reorder': material['items'].reverse()
            if mutation == 'identity': material['number'] = 2
            if mutation == 'material': broken['materials'].clear()
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                additions.assert_catalog_append_only(old, broken)

    def test_new_material_template_is_valid(self):
        self.assertEqual(additions.builder.read_csv(ROOT/'templates/新しい資料.csv'), [])

    def test_verify_git_baseline_rejects_csv_edits(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'data').mkdir()
            path = root/'data/ドリーム.csv'
            path.write_text('施設名,説明\n既存,保存\n', encoding='utf-8')
            additions.builder.build(root)
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root, stderr=subprocess.STDOUT)
            git('init')
            git('add', 'data', 'generated')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'baseline')
            path.write_text('施設名,説明\n既存,保存\n追加,新規\n', encoding='utf-8')
            additions.builder.build(root)
            additions.verify(root, 'HEAD')
            path.write_text('施設名,説明\n既存,改変\n追加,新規\n', encoding='utf-8')
            additions.builder.build(root)
            with self.assertRaises(ValueError):
                additions.verify(root, 'HEAD')
