import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MaterialNumberTests(unittest.TestCase):
    def test_registry_numbers_are_contiguous_and_unique(self):
        registry = json.loads((ROOT / 'data/material-registry.json').read_text(encoding='utf-8'))
        numbers = [entry['number'] for entry in registry]
        self.assertEqual(numbers, list(range(1, len(numbers) + 1)))
        self.assertEqual(len(numbers), len(set(numbers)))

    def test_published_order_and_public_number_mapping(self):
        dataset = json.loads((ROOT / 'generated/facility-data.json').read_text(encoding='utf-8'))
        numbers = [material['number'] for material in dataset['materials']]
        self.assertEqual(numbers, list(range(1, len(numbers) + 1)))
        by_number = {material['number']: material['name'] for material in dataset['materials']}
        expected = {
            3: '都市インフラ見学・PR施設',
            6: '天文台・プラネタリウム',
            9: 'フェリー・旅客船ターミナル',
            10: '展望塔・展望施設',
            11: '空港ターミナル',
            14: '旧世代型商業施設',
            15: 'レトロゲームセンター',
            18: '東京の失われた名所',
            21: '団地商店街',
            23: '地域独自スーパー',
            30: '生物展示施設',
        }
        for number, name in expected.items():
            self.assertEqual(by_number[number], name)
        registry = json.loads((ROOT / 'data/material-registry.json').read_text(encoding='utf-8'))
        self.assertEqual(
            [(r['id'], r['number']) for r in registry],
            [(m['id'], m['number']) for m in dataset['materials']],
        )
        self.assertNotIn('csv-8d201c27e111597f8974', {m['id'] for m in dataset['materials']})


if __name__ == '__main__':
    unittest.main()
