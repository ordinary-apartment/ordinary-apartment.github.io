#!/usr/bin/env python3
"""Read-only duplicate review and append-only guards for facility additions."""
import argparse
import csv
import importlib.util
import io
import json
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'tools/build-data.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def normalized(value):
    return ''.join(unicodedata.normalize('NFKC', value).casefold().split())


def duplicate_reasons(left, right):
    reasons = []
    a, b = normalized(left['name']), normalized(right['name'])
    if a == b:
        reasons.append('同名（所在地・支店・別名を確認）')
    elif a and b and (a in b or b in a):
        reasons.append('施設名の部分一致')
    for key in ('official', 'maps'):
        url = left.get(key, '').rstrip('/')
        # Auto-generated search URLs are name searches, not facility identifiers.
        if url and 'google.com/maps/search/' not in url and url == right.get(key, '').rstrip('/'):
            reasons.append(f'{key} URL一致（共通サイトの場合あり）')
    return reasons


def duplicates(root, candidate):
    existing = [(p.name, i + 1, row) for p in sorted((root / 'data').glob('*.csv'))
                for i, row in enumerate(builder.read_csv(p))]
    results = []
    for index, row in enumerate(builder.read_csv(candidate), 1):
        for filename, position, other in existing:
            reasons = duplicate_reasons(row, other)
            if reasons:
                results.append({'candidateRow': index, 'name': row['name'], 'file': filename,
                                'row': position, 'existingName': other['name'],
                                'location': [other['prefecture'], other['city']], 'reasons': reasons})
        existing.append((str(candidate), index, row))
    return results


def csv_rows(raw):
    try:
        content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        content = raw.decode('cp932')
    return list(csv.reader(io.StringIO(content, newline=''), strict=True))


def assert_catalog_append_only(old, new):
    if old['schemaVersion'] != new['schemaVersion']:
        raise ValueError('schemaVersion が変更されています')
    current = {m['id']: m for m in new['materials']}
    old_ids = [m['id'] for m in old['materials']]
    if [m['id'] for m in new['materials'] if m['id'] in old_ids] != old_ids:
        raise ValueError('既存資料の順序または構成が変更されています')
    for material in old['materials']:
        updated = current.get(material['id'])
        if updated is None:
            raise ValueError(f"既存資料が削除されています: {material['name']}")
        for key in ('number', 'name', 'shortName', 'file'):
            if unicodedata.normalize('NFC', str(material[key])) != unicodedata.normalize('NFC', str(updated[key])):
                raise ValueError(f"既存資料の {key} が変更されています: {material['name']}")
        if updated['items'][:len(material['items'])] != material['items']:
            raise ValueError(f"既存施設の削除・変更・並べ替えがあります: {material['name']}")


def verify(root, base):
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=root)
    base = git('rev-parse', '--verify', base + '^{commit}').decode().strip()
    entries = git('ls-tree', '-rz', base, '--', 'data').decode().split('\0')
    for entry in filter(None, entries):
        metadata, name = entry.split('\t', 1)
        if not name.endswith('.csv'):
            continue
        blob = metadata.split()[2]
        path = root / name
        if not path.exists():
            raise ValueError(f'既存CSVが削除されています: {name}')
        before = csv_rows(git('cat-file', 'blob', blob))
        after = csv_rows(path.read_bytes())
        if after[:len(before)] != before:
            raise ValueError(f'既存CSVの列・行が変更されています: {name}')
    old_registry = json.loads(git('show', f'{base}:data/material-registry.json'))
    registry = json.loads((root / 'data/material-registry.json').read_text(encoding='utf-8'))
    if registry[:len(old_registry)] != old_registry:
        raise ValueError('既存の資料レジストリが変更されています')
    old = json.loads(git('show', f'{base}:generated/facility-data.json'))
    current = json.loads((root / 'generated/facility-data.json').read_text(encoding='utf-8'))
    assert_catalog_append_only(old, current)
    print(f'既存CSV・資料番号・全施設フィールド・行順を維持: {base[:12]}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    review = commands.add_parser('duplicates', help='候補CSVと全資料・候補内の重複候補を表示（書込なし）')
    review.add_argument('candidate', type=Path)
    guard = commands.add_parser('verify', help='基準commitからの追加だけであることを検証')
    guard.add_argument('--base', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'duplicates':
            results = duplicates(ROOT, args.candidate)
            print(json.dumps(results, ensure_ascii=False, indent=2))
            return 2 if results else 0
        verify(ROOT, args.base)
        return 0
    except (ValueError, OSError, csv.Error, subprocess.CalledProcessError) as error:
        parser.exit(1, f'追加検証エラー: {error}\n')


if __name__ == '__main__':
    raise SystemExit(main())
