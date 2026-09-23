#!/usr/bin/env python3
"""Build data/*.csv into browser JS/JSON using only Python's standard library."""
import csv
import hashlib
import io
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    'prefecture': ['都道府県', 'prefecture'],
    'city': ['市区町村', 'city'],
    'name': ['店舗名・施設名', '施設名', '店舗名', 'name'],
    'type': ['分類', 'type'],
    'note': ['説明・狙い目', '説明', '備考', 'note'],
    'official': ['公式サイト', '公式サイトURL', 'official'],
    'maps': ['Googleマップ', 'GoogleマップURL', 'maps'],
    'kind': ['雰囲気', 'kind'],
    'officialSearch': ['公式検索', 'officialSearch'],
    'mapQueryName': ['地図検索名', 'mapQueryName'],
    'related1Title': ['関連リンク1タイトル', 'relatedLink1Title'],
    'related1URL': ['関連リンク1URL', 'relatedLink1URL'],
    'related2Title': ['関連リンク2タイトル', 'relatedLink2Title'],
    'related2URL': ['関連リンク2URL', 'relatedLink2URL'],
    'related3Title': ['関連リンク3タイトル', 'relatedLink3Title'],
    'related3URL': ['関連リンク3URL', 'relatedLink3URL'],
}

def normalized_filename(value):
    """Use one filename identity on filesystems with different Unicode forms."""
    return unicodedata.normalize('NFC', value)

def canonical_url(value):
    parsed = urlsplit(value.strip())
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip('/') or '/', parsed.query, ''))

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
    if '評価' in headers or 'rank' in headers:
        raise ValueError(f'{path.name}: 評価列は廃止されました。関連リンク列へ移行してください')
    if any(
        re.fullmatch(r'(?:関連リンク|relatedLink)[4-9]\d*(?:タイトル|URL|Title|Url)', h)
        for h in headers
    ):
        raise ValueError(f'{path.name}: 関連リンクは最大3件まで指定できます')
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
        related_links=[]
        for index in range(1,4):
            title=item[f'related{index}Title'].strip()
            url=item[f'related{index}URL'].strip()
            if bool(title) != bool(url):
                raise ValueError(f'{path.name}:{reader.line_num}: 関連リンク{index}はタイトルとURLを両方指定してください')
            if not title:
                continue
            parsed=urlsplit(url)
            if parsed.scheme.lower() not in ('http','https') or not parsed.netloc or any(ord(c)<32 for c in url):
                raise ValueError(f'{path.name}:{reader.line_num}: 関連リンク{index}URLはhttp(s)のURLにしてください')
            if any(link['url']==url for link in related_links):
                raise ValueError(f'{path.name}:{reader.line_num}: 関連リンクURLが重複しています')
            if item['official'] and canonical_url(item['official']) == canonical_url(url):
                raise ValueError(f'{path.name}:{reader.line_num}: 関連リンクURLが公式サイトURLと重複しています')
            related_links.append({'title':title,'url':url})
        item['relatedLinks']=related_links
        for key in ['related1Title','related1URL','related2Title','related2URL','related3Title','related3URL']:
            item.pop(key, None)
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
    # macOS commonly presents filenames in NFD while Linux checkouts commonly
    # use NFC.  Keep the original spelling in the registry, but match files by
    # their NFC identity so a normalization change cannot allocate a new
    # material number.
    by_normalized_file = {}
    for entry in registry:
        key = normalized_filename(entry['file'])
        by_normalized_file.setdefault(key, []).append(entry)
    materials = []
    seen_files = set()
    for path in sorted(data.glob('*.csv'), key=lambda p:p.name):
        file_key = normalized_filename(path.name)
        if file_key in seen_files:
            raise ValueError(f'{path.name}: Unicode正規化後のファイル名が重複しています')
        seen_files.add(file_key)
        candidates = by_normalized_file.get(file_key, [])
        if candidates:
            # If an older registry contains both NFC and NFD spellings, the
            # highest reserved entry is the currently published identity.
            # Keeping that entry preserves existing URL keys and row links;
            # the normalized filename still makes both spellings equivalent.
            entry = max(candidates, key=lambda item: item['number'])
        else:
            entry = {'file':path.name, 'id':'csv-'+hashlib.sha256(file_key.encode()).hexdigest()[:20], 'number':max((r['number'] for r in registry),default=0)+1}
            registry.append(entry)
            by_normalized_file.setdefault(file_key, []).append(entry)
        items = read_csv(path)
        material_name = normalized_filename(path.stem)
        materials.append({'id':entry['id'], 'number':entry['number'], 'name':material_name, 'shortName':entry.get('short',material_name), 'file':path.name, 'count':len(items), 'items':items})
    materials.sort(key=lambda m:m['number'])
    dataset = {'schemaVersion':2, 'materialCount':len(materials), 'total':sum(m['count'] for m in materials), 'materials':materials}
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
