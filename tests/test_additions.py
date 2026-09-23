import copy
import importlib.util
from pathlib import Path
import tempfile
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('additions', ROOT/'tools/check-additions.py')
additions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(additions)


class AdditionTests(unittest.TestCase):
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
