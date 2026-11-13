#!/usr/bin/env python3
"""Claude 앱 아티팩트 미리보기용 묶음을 만든다.

사용법: python3 build_preview.py <작업 폴더> <미리보기 폴더> "<제목>"

- 작업 폴더의 index.html <body> 내용과 assets(css, images)를 미리보기 폴더로 복사한다 (scss 제외)
- 아티팩트에서 막히는 외부 CSS(Pretendard CDN, boxicons CDN)를 npm에서 받은 로컬 폰트로 바꾼다
- Google Fonts 링크와 code.jquery.com 스크립트는 그대로 둔다 (아티팩트에서 허용됨)
- 게시할 파일 목록을 <미리보기 폴더>/files.json 으로 저장하고 출력한다
"""
import json
import os
import re
import shutil
import subprocess
import sys


def main():
    if len(sys.argv) < 4:
        sys.exit('사용법: build_preview.py <작업 폴더> <미리보기 폴더> "<제목>"')
    src, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
    cache = os.path.expanduser('~/.cache/figma-to-web-fonts')
    os.makedirs(cache, exist_ok=True)
    nm = os.path.join(cache, 'node_modules')
    if not os.path.isdir(os.path.join(nm, 'pretendard-std')) or not os.path.isdir(os.path.join(nm, '@boxicons')):
        subprocess.run(['npm', 'i', '--silent', '--prefix', cache, 'pretendard-std@1.3.9', '@boxicons/core@1.0.6'], check=True)

    if os.path.isdir(out):
        shutil.rmtree(out)
    shutil.copytree(os.path.join(src, 'assets'), os.path.join(out, 'assets'),
                    ignore=shutil.ignore_patterns('scss'))

    fonts = os.path.join(out, 'assets', 'preview-fonts')
    os.makedirs(os.path.join(fonts, 'boxicons'), exist_ok=True)
    faces = []
    for weight, name in [(400, 'Regular'), (500, 'Medium'), (600, 'SemiBold'), (700, 'Bold'), (800, 'ExtraBold')]:
        f = f'PretendardStd-{name}.woff2'
        shutil.copy(os.path.join(nm, 'pretendard-std/dist/web/static/woff2', f), os.path.join(fonts, f))
        faces.append(f'@font-face{{font-family:"Pretendard Std";font-weight:{weight};font-display:swap;src:url("./{f}") format("woff2")}}')
    with open(os.path.join(fonts, 'pretendard.css'), 'w') as fp:
        fp.write('\n'.join(faces) + '\n')
    bx = os.path.join(nm, '@boxicons/core/fonts/basic')
    shutil.copy(os.path.join(bx, 'boxicons.woff2'), os.path.join(fonts, 'boxicons', 'boxicons.woff2'))
    css = open(os.path.join(bx, 'boxicons.min.css')).read()
    css = re.sub(r'@font-face\{[^}]*\}',
                 '@font-face{font-family:"boxicons";src:url("./boxicons.woff2") format("woff2");font-weight:400;font-display:block}',
                 css, count=1)
    with open(os.path.join(fonts, 'boxicons', 'boxicons.min.css'), 'w') as fp:
        fp.write(css)

    html = open(os.path.join(src, 'index.html'), encoding='utf-8').read()
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    lines = []
    for line in head.splitlines():
        t = line.strip()
        if not t or t.startswith('<meta') or t.startswith('<title'):
            continue
        if 'pretendard' in t.lower() and 'stylesheet' in t:
            t = '<link rel="stylesheet" href="./assets/preview-fonts/pretendard.css">'
        elif 'boxicons' in t and 'stylesheet' in t:
            t = '<link rel="stylesheet" href="./assets/preview-fonts/boxicons/boxicons.min.css">'
        lines.append(t)
    page = f'<title>{title}</title>\n' + '\n'.join(lines) + '\n<style>body{margin:0;background:#fff;color:#1e1c1b}</style>\n' + body
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf-8') as fp:
        fp.write(page)

    files = {}
    for root, _, names in os.walk(os.path.join(out, 'assets')):
        for n in names:
            rel = os.path.relpath(os.path.join(root, n), out).replace(os.sep, '/')
            files[rel] = rel
    files = dict(sorted(files.items()))
    with open(os.path.join(out, 'files.json'), 'w', encoding='utf-8') as fp:
        json.dump(files, fp, ensure_ascii=False)
    print(json.dumps(files, ensure_ascii=False))


if __name__ == '__main__':
    main()
