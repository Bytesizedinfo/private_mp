"""Build Spend & Save from src/ into its two published forms.

    python build.py            writes dist/artifact.html (claude.ai), index.html (phone app), sw.js cache name,
                               and tests/engine_test.html
    python build.py --check A P  compares the claude.ai build with file A and the phone build with file P (no writes)

The page is one self-contained HTML file in both places, so it works offline once the phone app has cached it.
Source parts (all UTF-8, LF line endings):
    src/fonts.html      Google Fonts links            src/style.css   all CSS
    src/body.html       header, main, tab bar, sheet  src/money.js    pure money logic (no DOM), testable on its own
    src/app.js          the app (inside one IIFE)     src/head-pwa.html  the phone app's <head> start
    tests/engine.test.js  engine test cases, run by tests/engine_test.html
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
TITLE = '<title>Spend &amp; Save</title>\n'
SW_REG = "<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>\n"


def read(name):
    p = SRC / name
    return p.read_text(encoding='utf-8').replace('\r\n', '\n') if p.exists() else ''


APP_PARTS = ['app.js', 'plan.js', 'charts.js', 'views.js', 'sheets.js', 'demo.js', 'boot.js']  # one IIFE, in this order


def scripts():
    money = read('money.js')
    out = '<script id="money">\n' + money + '</script>\n' if money else ''
    return out + "<script>\n(() => {\n'use strict';\n" + ''.join(read(p) for p in APP_PARTS) + '})();\n</script>\n'


def artifact():
    return (TITLE + '<meta name="claude:viewport-fit-sides" content="cover">\n' + read('fonts.html')
            + '<style>\n' + read('style.css') + '</style>\n\n' + read('body.html') + '\n' + scripts() + '\n')


def pwa():
    return (read('head-pwa.html') + TITLE + read('fonts.html') + '<style>\n' + read('style.css') + '</style>\n</head>\n<body>\n'
            + read('body.html') + '\n' + scripts() + SW_REG + '</body>\n</html>\n')


def test_page():
    money, tests = read('money.js'), (ROOT / 'tests' / 'engine.test.js')
    if not money or not tests.exists():
        return None
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Engine tests</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:16px;background:#fff;color:#111}'
            '.ok{color:#1f7a45}.bad{color:#c0352f;font-weight:700}pre{white-space:pre-wrap;margin:0}h1{font-size:18px}</style></head><body>'
            '<h1>Spend &amp; Save engine tests</h1><div id="out">Running…</div>\n<script id="money">\n' + money + '</script>\n<script>\n'
            + tests.read_text(encoding='utf-8').replace('\r\n', '\n') + '</script>\n</body></html>\n')


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8', newline='\n')


def main(argv):
    if argv[:1] == ['--check']:
        norm = lambda p: pathlib.Path(p).read_text(encoding='utf-8').replace('\r\n', '\n')
        ok = True
        for name, built, ref in [('claude.ai', artifact(), argv[1]), ('phone', pwa(), argv[2])]:
            same = built == norm(ref)
            ok &= same
            print(f'{name}: {"identical" if same else "DIFFERENT"} ({len(built)} chars)')
        return 0 if ok else 1
    a, p = artifact(), pwa()
    write(ROOT / 'dist' / 'artifact.html', a)
    write(ROOT / 'index.html', p)
    sw = ROOT / 'sw.js'
    tag = hashlib.sha256(p.encode('utf-8')).hexdigest()[:10]
    sw_text = sw.read_text(encoding='utf-8').replace('\r\n', '\n')
    sw_text = re.sub(r"const CACHE = '[^']*';", f"const CACHE = 'spend-save-{tag}';", sw_text, count=1)
    write(sw, sw_text)
    t = test_page()
    if t:
        write(ROOT / 'tests' / 'engine_test.html', t)
    ui = ROOT / 'tests' / 'ui.test.js'
    if ui.exists():  # the claude.ai build with an error recorder and the UI smoke test (example data outside claude.ai)
        hook = "<script>window.__errs=[];addEventListener('error',e=>window.__errs.push(e.message+' @'+(e.lineno||'')+':'+(e.colno||'')));addEventListener('unhandledrejection',e=>window.__errs.push('rejection: '+(e.reason&&e.reason.stack||e.reason)));</script>\n"
        write(ROOT / 'tests' / 'app_test.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'
              + hook + a + '<script>\n' + ui.read_text(encoding='utf-8').replace('\r\n', '\n') + '</script>\n</body></html>\n')
    print(f'built dist/artifact.html ({len(a.encode())} bytes), index.html ({len(p.encode())} bytes), sw cache spend-save-{tag}'
          + (', tests/engine_test.html' if t else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
