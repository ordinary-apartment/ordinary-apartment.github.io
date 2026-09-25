import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SocialStudyTests(unittest.TestCase):
    def test_social_material_and_legacy_label_are_consistent(self):
        dataset = json.loads((ROOT / 'generated/facility-data.json').read_text(encoding='utf-8'))
        social = next(material for material in dataset['materials'] if material['name'] == '社会科見学施設')
        self.assertGreaterEqual(len(social['items']), 100)
        self.assertFalse(any(material['name'] == '都市インフラ見学・PR施設' for material in dataset['materials']))
        retired_label = 'インフラ' + '・PR館'
        self.assertFalse(retired_label in (ROOT / 'generated/facility-data.json').read_text(encoding='utf-8'))

    def test_related_links_contain_no_direct_pdf(self):
        dataset = json.loads((ROOT / 'generated/facility-data.json').read_text(encoding='utf-8'))
        urls = [
            link['url']
            for material in dataset['materials']
            for item in material['items']
            for link in item.get('relatedLinks', [])
        ]
        self.assertFalse(any(re.search(r'\.pdf(?:$|[?#])', url, re.IGNORECASE) for url in urls))


if __name__ == '__main__':
    unittest.main()
