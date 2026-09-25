#!/usr/bin/env python3
"""Version every local JS/CSS reference by its content; fail on missing assets."""
import argparse
import hashlib
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = re.compile(r'((?:src|href)=")([^"?#]+\.(?:js|css))(?:\?[^"#]*)?(")')


def version_html(root):
    html = (root / 'index.html').read_text(encoding='utf-8')

    def replace(match):
        prefix, name, suffix = match.groups()
        if name.startswith(('https:', 'http:', '//')):
            return match.group(0)
        digest = hashlib.sha256((root / name).read_bytes()).hexdigest()[:16]
        return f'{prefix}{name}?v={digest}{suffix}'

    return REFERENCE.sub(replace, html)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'index.html'
    expected = version_html(ROOT)
    if args.check:
        if path.read_text(encoding='utf-8') != expected:
            parser.exit(1, 'Asset versions are stale: run python3 -B tools/version-assets.py\n')
        print('All local JS/CSS content hashes match')
    else:
        path.write_text(expected, encoding='utf-8')
