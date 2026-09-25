import csv
import importlib.util
import json
import unicodedata
from pathlib import Path
import tempfile
import unittest
spec = importlib.util.spec_from_file_location('builder',Path(__file__).resolve().parents[1]/'tools/build-data.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root/'data').mkdir()
    def write(self,name,rows,encoding='utf-8-sig'):
        with (self.root/'data'/name).open('w',encoding=encoding,newline='') as f:
            csv.writer(f).writerows(rows)
    def test_add_delete_resequences_display_numbers(self):
        self.write('植物園.csv',[['施設名'],['元の施設']])
        first=builder.build(self.root)['materials'][0]
        self.write('あたらしい資料.csv',[['施設名'],['追加1'],['追加2']])
        data=builder.build(self.root)
        self.assertEqual(data['total'],3)
        self.assertEqual(data['materials'][0]['id'],first['id'])
        self.assertEqual(data['materials'][1]['number'],2)
        (self.root/'data/植物園.csv').unlink()
        self.assertEqual(builder.build(self.root)['materials'][0]['number'],1)
        self.write('植物園.csv',[['施設名'],['復帰']])
        restored=builder.build(self.root)
        self.assertEqual(restored['materials'][0]['number'],1)
    def test_quotes_newlines_extras_and_maps(self):
        self.write('資料.csv',[['施設名','説明','独自列'],['施設,"A"','一行目\n二行目','保存'],['','','']])
        item=builder.build(self.root)['materials'][0]['items'][0]
        self.assertEqual(item['note'],'一行目\n二行目')
        self.assertEqual(item['extra'],{'独自列':'保存'})
        self.assertEqual(item['relatedLinks'],[])
        self.assertTrue(item['maps'].startswith('https://www.google.com/maps/search/'))
    def test_cp932_and_empty_material(self):
        self.write('日本語.csv',[['施設名'],['図書館']],encoding='cp932')
        self.write('空.csv',[['施設名']])
        data=builder.build(self.root)
        self.assertEqual(data['total'],1)
        self.assertEqual(data['materialCount'],2)
    def test_invalid_inputs_do_not_overwrite(self):
        self.write('資料.csv',[['施設名'],['既存']])
        builder.build(self.root)
        old=(self.root/'generated/facility-data.js').read_bytes()
        cases=[[['評価'],['S']],[['施設名','公式サイト'],['施設','javascript:alert(1)']],[['施設名','評価'],['','S']],[['施設名','施設名'],['a','b']],[['施設名'],['a','余分']]]
        for rows in cases:
            self.write('不正.csv',rows)
            with self.assertRaises(ValueError): builder.build(self.root)
            self.assertEqual((self.root/'generated/facility-data.js').read_bytes(),old)
    def test_deterministic_output(self):
        self.write('資料.csv',[['施設名'],['施設']])
        builder.build(self.root)
        old=(self.root/'generated/facility-data.js').read_bytes()
        builder.build(self.root)
        self.assertEqual((self.root/'generated/facility-data.js').read_bytes(),old)

    def test_rename_and_delete_preserve_surviving_material_identity(self):
        self.write('削除.csv', [['施設名'], ['削除対象']])
        self.write('変更前.csv', [['施設名', '公式サイト'], ['残す施設', 'https://example.com/']])
        before = builder.build(self.root)
        survivor = next(m for m in before['materials'] if m['name'] == '変更前')
        (self.root/'data/削除.csv').unlink()
        (self.root/'data/変更前.csv').rename(self.root/'data/変更後.csv')
        registry_path = self.root/'data/material-registry.json'
        registry = json.loads(registry_path.read_text())
        next(r for r in registry if r['id'] == survivor['id'])['file'] = '変更後.csv'
        registry_path.write_text(json.dumps(registry, ensure_ascii=False))
        for name in ('facility-data.js', 'facility-data.json', 'material-registry.json'):
            (self.root/name).write_text('outdated')
        after = builder.build(self.root)
        self.assertEqual(after['materialCount'], 1)
        self.assertEqual(after['materials'][0]['number'], 1)
        self.assertEqual(after['materials'][0]['id'], survivor['id'])
        self.assertEqual(after['materials'][0]['items'], survivor['items'])
        self.assertEqual(after['materials'][0]['name'], '変更後')
        for name in ('facility-data.js', 'facility-data.json', 'material-registry.json'):
            source = self.root/('data' if name == 'material-registry.json' else 'generated')/name
            self.assertEqual((self.root/name).read_bytes(), source.read_bytes())

    def test_nfc_and_nfd_filename_keep_same_material_identity(self):
        nfc='植物園.csv'
        nfd=unicodedata.normalize('NFD', nfc)
        self.write(nfc,[['施設名'],['元の施設']])
        first=builder.build(self.root)['materials'][0]
        (self.root/'data'/nfc).unlink()
        self.write(nfd,[['施設名'],['同じ資料']])
        second=builder.build(self.root)['materials'][0]
        self.assertEqual(second['id'],first['id'])
        self.assertEqual(second['number'],first['number'])
        self.assertEqual(second['name'],unicodedata.normalize('NFC',nfc).removesuffix('.csv'))

    def test_related_links_zero_one_and_three(self):
        headers=['施設名','関連リンク1タイトル','関連リンク1URL','関連リンク2タイトル','関連リンク2URL','関連リンク3タイトル','関連リンク3URL']
        self.write('リンク.csv',[headers,
            ['なし','','','','','',''],
            ['一件','個人記事','https://example.com/one','','','',''],
            ['三件','記事1','https://example.com/1','記事2','https://example.com/2','記事3','https://example.com/3'],
        ])
        items=builder.build(self.root)['materials'][0]['items']
        self.assertEqual(items[0]['relatedLinks'],[])
        self.assertEqual(items[1]['relatedLinks'],[{'title':'個人記事','url':'https://example.com/one'}])
        self.assertEqual(items[2]['relatedLinks'],[
            {'title':'記事1','url':'https://example.com/1'},
            {'title':'記事2','url':'https://example.com/2'},
            {'title':'記事3','url':'https://example.com/3'},
        ])

    def test_related_links_reject_invalid_pairs_urls_duplicates_and_fourth(self):
        cases=[
            [['施設名','関連リンク1タイトル','関連リンク1URL'],['施設','タイトル','']],
            [['施設名','関連リンク1タイトル','関連リンク1URL'],['施設','','https://example.com/one']],
            [['施設名','関連リンク1タイトル','関連リンク1URL'],['施設','タイトル','javascript:alert(1)']],
            [['施設名','関連リンク1タイトル','関連リンク1URL','関連リンク2タイトル','関連リンク2URL'],['施設','同じ','https://example.com/same','同じ2','https://example.com/same']],
            [['施設名','関連リンク4タイトル','関連リンク4URL'],['施設','4件目','https://example.com/four']],
        ]
        for rows in cases:
            self.write('不正リンク.csv',rows)
            with self.assertRaises(ValueError): builder.build(self.root)
            (self.root/'data/不正リンク.csv').unlink()

    def test_related_link_cannot_duplicate_official_url(self):
        self.write('不正リンク.csv', [
            ['施設名', '公式サイト', '関連リンク1タイトル', '関連リンク1URL'],
            ['施設', 'https://example.com/official/', '解説', 'https://EXAMPLE.com/official#top'],
        ])
        with self.assertRaisesRegex(ValueError, '公式サイトURLと重複'):
            builder.build(self.root)

    def test_published_catalog_matches_csv_and_generated_javascript(self):
        root = Path(__file__).resolve().parents[1]
        current = json.loads((root/'generated/facility-data.json').read_text(encoding='utf-8'))
        import shutil
        for path in (root/'data').iterdir():
            if path.suffix in ('.csv', '.json'):
                shutil.copyfile(path, self.root/'data'/path.name)
        expected = builder.build(self.root)
        # Filesystem spelling differs on macOS and Linux; data identity does not.
        for dataset in (current, expected):
            for material in dataset['materials']:
                material['file'] = unicodedata.normalize('NFC', material['file'])
        self.assertEqual(current, expected)
        self.assertEqual(current['materialCount'], len(current['materials']))
        self.assertEqual(current['total'], sum(m['count'] for m in current['materials']))
        js = (root/'generated/facility-data.js').read_text(encoding='utf-8')
        js_data = json.loads(js.removeprefix('window.FACILITY_DATASET=').rstrip().removesuffix(';'))
        for material in js_data['materials']:
            material['file'] = unicodedata.normalize('NFC', material['file'])
        self.assertEqual(js_data, current)
        self.assertTrue(all('rank' not in item and isinstance(item['relatedLinks'], list)
                            for m in current['materials'] for item in m['items']))
if __name__=='__main__': unittest.main()
