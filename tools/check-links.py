#!/usr/bin/env python3
"""Validate registered related links by fetching their real destinations.

HTML links must contain the facility name (or its significant parts) in the
page title/body. PDF links must be fetched successfully and have a PDF content
type; their facility-specific contents still require the manual review
described in the repository addition procedure because this project has no PDF
text extraction dependency.
"""
import argparse
import csv
import html
import io
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = 'ordinary-apartment-facility-link-checker/1.0'


def norm(value):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', value).casefold())


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = []
        self.text = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        self.in_title = tag.lower() == 'title'

    def handle_endtag(self, tag):
        if tag.lower() == 'title':
            self.in_title = False

    def handle_data(self, data):
        (self.title if self.in_title else self.text).append(data)


def context_terms(name):
    # Full Japanese names are useful; parenthetical aliases are also accepted.
    terms = [norm(name)]
    terms.extend(norm(part) for part in re.split(r'[（(／/・）)]', name) if len(norm(part)) >= 3)
    compact = norm(name)
    # A page may omit a locality prefix (e.g. “高島平”) while retaining the
    # distinctive street name. Require six-character substrings to avoid
    # accepting a generic page that merely says “商店街”.
    terms.extend(compact[index:index + 6] for index in range(max(0, len(compact) - 5)))
    return [term for term in terms if term]


def check_url(url, name, timeout):
    parsed = urlsplit(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        return False, 'http(s) URLではありません'
    request = Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urlopen(request, timeout=timeout) as response:
            status = getattr(response, 'status', 200)
            final_url = response.geturl()
            content_type = response.headers.get_content_type().lower()
            body = response.read(4 * 1024 * 1024)
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        return False, f'取得失敗: {error}'
    if not 200 <= status < 300:
        return False, f'HTTPステータス {status}'
    if urlsplit(final_url).netloc != parsed.netloc:
        return False, f'別ドメインへ転送: {final_url}'
    if content_type == 'application/pdf' or final_url.lower().split('?', 1)[0].endswith('.pdf'):
        if not body.startswith(b'%PDF') or len(body) < 512:
            return False, 'PDFとして取得できません'
        return True, 'PDF取得済み（本文と対象性は手動確認が必要）'
    charset = response.headers.get_content_charset() or 'utf-8'
    text = body.decode(charset, errors='replace')
    parser = TextParser()
    try:
        parser.feed(text)
    except Exception as error:
        return False, f'HTML解析失敗: {error}'
    title = html.unescape(' '.join(parser.title)).strip()
    visible = html.unescape(' '.join(parser.text))
    if not title:
        return False, 'ページタイトルがありません'
    terms = context_terms(name)
    if not any(term in norm(title) or term in norm(visible) for term in terms):
        return False, f'タイトル・本文に施設名がありません（title={title!r}）'
    return True, f'HTTP {status}; title={title!r}; final={final_url}'


def iter_links(path):
    raw = path.read_bytes()
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('cp932')
    reader = csv.DictReader(io.StringIO(text, newline=''), strict=True)
    for line, row in enumerate(reader, 2):
        name = row.get('店舗名・施設名') or row.get('施設名') or row.get('店舗名') or ''
        for index in range(1, 4):
            title = (row.get(f'関連リンク{index}タイトル') or '').strip()
            url = (row.get(f'関連リンク{index}URL') or '').strip()
            if title and url:
                yield line, name, index, title, url


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_file', type=Path)
    parser.add_argument('--timeout', type=float, default=20)
    args = parser.parse_args()
    failures = 0
    checked = 0
    for line, name, index, title, url in iter_links(args.csv_file):
        checked += 1
        ok, detail = check_url(url, name, args.timeout)
        print(f'{"OK" if ok else "NG"} {args.csv_file}:{line} 関連リンク{index} {title}: {detail}')
        failures += not ok
    if not checked:
        print(f'{args.csv_file}: 検証対象リンクなし')
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
