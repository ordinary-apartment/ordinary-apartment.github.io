import csv
import importlib.util
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
    def test_add_delete_restore_stable_numbers(self):
        self.write('植物園.csv',[['施設名'],['元の施設']])
        first=builder.build(self.root)['materials'][0]
        self.write('あたらしい資料.csv',[['施設名'],['追加1'],['追加2']])
        data=builder.build(self.root)
        self.assertEqual(data['total'],3)
        self.assertEqual(data['materials'][0]['id'],first['id'])
        self.assertEqual(data['materials'][1]['number'],2)
        (self.root/'data/植物園.csv').unlink()
        self.assertEqual(builder.build(self.root)['materials'][0]['number'],2)
        self.write('植物園.csv',[['施設名'],['復帰']])
        self.assertEqual(builder.build(self.root)['materials'][0]['id'],first['id'])
    def test_quotes_newlines_extras_and_maps(self):
        self.write('資料.csv',[['施設名','説明','独自列'],['施設,"A"','一行目\n二行目','保存'],['','','']])
        item=builder.build(self.root)['materials'][0]['items'][0]
        self.assertEqual(item['note'],'一行目\n二行目')
        self.assertEqual(item['extra'],{'独自列':'保存'})
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
if __name__=='__main__': unittest.main()
