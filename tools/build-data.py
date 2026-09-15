#!/usr/bin/env python3
"""Build data/*.csv into browser JS/JSON using only Python's standard library."""
import csv
import hashlib
import io
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    'prefecture': ['都道府県', 'prefecture'],
    'city': ['市区町村', 'city'],
    'name': ['店舗名・施設名', '施設名', '店舗名', 'name'],
    'type': ['分類', 'type'],
    'rank': ['評価', 'rank'],
    'note': ['説明・狙い目', '説明', '備考', 'note'],
    'official': ['公式サイト', '公式サイトURL', 'official'],
    'maps': ['Googleマップ', 'GoogleマップURL', 'maps'],
    'kind': ['雰囲気', 'kind'],
    'officialSearch': ['公式検索', 'officialSearch'],
    'mapQueryName': ['地図検索名', 'mapQueryName'],
}

def read_csv(path):
    raw = path.read_bytes()
    try:
        content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        content = raw.decode('cp932')
    reader = csv.DictReader(io.StringIO(content, newline=''), strict=True)
    headers = reader.fieldnames
    if not headers or any(not h for h in headers) or len(set(headers)) != len(headers):
        raise ValueError(f'{path.name}: 列名が空または重複しています')
    selected = {}
    for key, aliases in FIELDS.items():
        found = [a for a in aliases if a in headers]
        if len(found) > 1:
            raise ValueError(f'{path.name}: 同じ項目の列が複数あります: {found}')
        selected[key] = found[0] if found else None
    if not selected['name']:
        raise ValueError(f'{path.name}: 店舗名・施設名（または施設名）列が必要です')
    known = {v for v in selected.values() if v}
    items = []
    for row in reader:
        if None in row or any(v is None for v in row.values()):
            raise ValueError(f'{path.name}:{reader.line_num}: 列数が見出しと一致しません')
        if not any(v.strip() for v in row.values()):
            continue
        item = {key: row[col] if col else '' for key, col in selected.items()}
        if not item['name'].strip():
            raise ValueError(f'{path.name}:{reader.line_num}: 施設名が空です')
        for key in ['official', 'maps', 'officialSearch']:
            value = item[key]
            if value and (urlsplit(value).scheme.lower() not in ('http', 'https') or not urlsplit(value).netloc or any(ord(c)<32 for c in value)):
                raise ValueError(f'{path.name}:{reader.line_num}: {key} は http(s) のURLにしてください')
        if not item['maps']:
            query = ' '.join(filter(None, [item['mapQueryName'] or item['name'], item['prefecture'], item['city']]))
            item['maps'] = 'https://www.google.com/maps/search/?api=1&query=' + quote(query, safe='')
        extra = {k:v for k,v in row.items() if k not in known}
        if extra:
            item['extra'] = extra
        items.append(item)
    return items

def build(root=ROOT):
    data = root / 'data'
    registry_path = data / 'material-registry.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8')) if registry_path.exists() else []
    for field in ['file', 'id', 'number']:
        if len({r[field] for r in registry}) != len(registry):
            raise ValueError(f'資料番号管理ファイル: {field} が重複しています')
    for r in registry:
        if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*',r['id']) or not isinstance(r['number'],int) or r['number']<1:
            raise ValueError('資料番号管理ファイル: IDまたは番号が不正です')
    by_file = {r['file']:r for r in registry}
    materials = []
    for path in sorted(data.glob('*.csv'), key=lambda p:p.name):
        if path.name not in by_file:
            entry = {'file':path.name, 'id':'csv-'+hashlib.sha256(path.name.encode()).hexdigest()[:20], 'number':max((r['number'] for r in registry),default=0)+1}
            registry.append(entry)
            by_file[path.name] = entry
        entry = by_file[path.name]
        items = read_csv(path)
        materials.append({'id':entry['id'], 'number':entry['number'], 'name':path.stem, 'shortName':entry.get('short',path.stem), 'file':path.name, 'count':len(items), 'items':items})
    materials.sort(key=lambda m:m['number'])
    dataset = {'schemaVersion':1, 'materialCount':len(materials), 'total':sum(m['count'] for m in materials), 'materials':materials}
    # Write only after ALL inputs pass validation, so a bad CSV cannot replace a valid build.
    generated = root / 'generated'
    generated.mkdir(exist_ok=True)
    payload = json.dumps(dataset, ensure_ascii=False, indent=2)+'\n'
    (generated/'facility-data.json').write_text(payload, encoding='utf-8')
    (generated/'facility-data.js').write_text('window.FACILITY_DATASET='+payload.rstrip().replace('\u2028','\\u2028').replace('\u2029','\\u2029')+';\n', encoding='utf-8')
    registry_path.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"{len(materials)}資料 / {dataset['total']}件を生成しました")
    return dataset

if __name__ == '__main__':
    try:
        build()
    except (ValueError, OSError, csv.Error) as error:
        print(f'CSV生成エラー: {error}',file=sys.stderr)
        sys.exit(1)
