"""Build the site: inline the fonts into src/index.html and write site/index.html.

    python3 build.py              -> site/index.html
    python3 build.py --preview    -> also writes preview.html (page body only, for quick previews)
"""
import base64, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = ROOT / "fonts"
FONT_FILES = {
    "SG400": "schibsted-grotesk-latin-400-normal.woff2",
    "SG500": "schibsted-grotesk-latin-500-normal.woff2",
    "SG600": "schibsted-grotesk-latin-600-normal.woff2",
    "DM400": "dm-mono-latin-400-normal.woff2",
    "DM500": "dm-mono-latin-500-normal.woff2",
    "NR400I": "newsreader-latin-400-italic.woff2",
}

src = (ROOT / "src" / "index.html").read_text()
for key, name in FONT_FILES.items():
    src = src.replace(f"%%{key}%%", base64.b64encode((FONTS / name).read_bytes()).decode())
assert "%%" not in src, "a font placeholder was left unfilled"

if "--preview" in sys.argv:
    (ROOT / "preview.html").write_text(src)

head, body = src.split("<!-- body -->", 1)
icon = "data:image/svg+xml," + (
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><path d='M5 8 24 11V33L5 36Z' fill='%23E4FE00' stroke='%23141414' stroke-width='2' stroke-linejoin='round'/><g stroke='%23141414' stroke-width='2' stroke-linecap='round'><path d='M26 15 29 18M31 13 34 16M26 22 29 25M31 20 34 23M26 29 29 32M31 27 34 30'/></g></svg>"
).replace("<", "%3C").replace(">", "%3E").replace(" ", "%20")
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
extra = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="canonical" href="https://thecu.be/">
<link rel="icon" href="{icon}">
<meta property="og:title" content="the cube">
<meta property="og:description" content="Unfolding perspectives. The practice of Gabriel Baude, Principal Product Designer (fractional).">
<meta property="og:url" content="https://thecu.be/">
<meta property="og:type" content="website">
'''
out = f'<!doctype html>\n<html lang="en">\n<head>\n{extra}{head}</head>\n<body>{body}</body>\n</html>\n'
(ROOT / "site").mkdir(exist_ok=True)
(ROOT / "site" / "index.html").write_text(out)
print(f"site/index.html  {len(out) // 1024} KB")
