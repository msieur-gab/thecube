"""Export the cube mark as SVG stills and GIF turns, in three colourways.

Same drawing as js/components/cube-mark.js (one cube, perspective camera, two solid faces and
two hatched faces, opposite each other), drawn without the page.

    python3 tools/logo.py            -> assets/logo/svg/*.svg and assets/logo/gif/*.gif

The cube looks the same every half turn (solid faces face each other), so the stills cover
0-165 degrees in 15-degree steps, and a GIF of a half turn loops into a full 360 turn.
"""
import math, pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "logo"

INK, ACCENT, WHITE, PAPER, SHADE = "#141414", "#E4FE00", "#FFFFFF", "#DEDEDC", "#000000"
COLOURWAYS = {               # name: (solid face, hatching, inside shade opacity, GIF background)
    "yellow-black": (ACCENT, INK, .12, PAPER),   # as on the site
    "black": (INK, INK, .12, WHITE),
    "white": (WHITE, WHITE, .45, INK),
}
# The inside of the cube is a shade of black, so it always reads darker than what is behind it
# (as in the reference). SVGs keep it see-through; GIFs cannot (their transparency is on/off),
# so each GIF has a solid background.
D = 2.6                      # camera distance, as on the page


def faces(yaw, mw):
    """Visible faces, back to front, in a mw x mw box (same maths as cube-mark.js)."""
    cx = cy = mw / 2
    S = mw * .5

    def pt(a, y):
        x, z = math.sqrt(.5) * math.sin(a), math.sqrt(.5) * math.cos(a)
        f = D / (D - z)
        return (cx + x * f * S, cy - y * f * S)

    fs, back = [], []
    for fi in range(4):
        th = yaw + fi * math.pi / 2
        nx, nz = math.sin(th), math.cos(th)
        face = {"solid": fi % 2 == 0, "z": nz,
                "B0": pt(th - math.pi / 4, -.5), "B1": pt(th + math.pi / 4, -.5),
                "T1": pt(th + math.pi / 4, .5), "T0": pt(th - math.pi / 4, .5)}
        (back if nx * -.5 * nx + nz * (D - .5 * nz) <= 0 else fs).append(face)
    fs.sort(key=lambda f: f["z"])
    return back, fs


def lp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def hatches(f, G=6, d=.055):
    """The short diagonal strokes of a hatched face (large-size settings of cube-mark.js)."""
    at = lambda uu, vv: lp(lp(f["B0"], f["B1"], uu), lp(f["T0"], f["T1"], uu), vv)
    for i in range(G):
        for j in range(G):
            u, v = (i + .5) / G, (j + .5) / G
            yield at(u - d, v - d), at(u + d, v + d)


def svg(yaw, solid, hatch, inside, mw=100):
    n = lambda p: f"{p[0]:.2f},{p[1]:.2f}"
    back, front = faces(yaw, mw)
    quad = lambda f: f'M{n(f["B0"])}L{n(f["B1"])}L{n(f["T1"])}L{n(f["T0"])}Z'
    parts = [f'<path d="{"".join(quad(f) for f in back)}" fill="{SHADE}" fill-opacity="{inside}"/>']
    for f in front:
        if f["solid"]:
            parts.append(f'<path d="M{n(f["B0"])}L{n(f["B1"])}L{n(f["T1"])}L{n(f["T0"])}Z" fill="{solid}"/>')
        else:
            d = "".join(f"M{n(a)}L{n(b)}" for a, b in hatches(f))
            parts.append(f'<path d="{d}" fill="none" stroke="{hatch}" stroke-width="{mw / 70:.3f}" stroke-linecap="butt"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {mw} {mw}" width="{mw * 5}" height="{mw * 5}">'
            + "".join(parts) + "</svg>\n")


def frame(yaw, solid, hatch, inside, px=512, ss=4):
    """One RGBA frame, drawn at ss times the size and scaled down for smooth edges."""
    mw = px * ss
    back, front = faces(yaw, mw)
    shade = Image.new("L", (mw, mw), 0)
    for f in back:                                            # the inside, seen through the hatching
        ImageDraw.Draw(shade).polygon([f["B0"], f["B1"], f["T1"], f["T0"]], fill=round(255 * inside))
    im = Image.new("RGBA", (mw, mw), SHADE)
    im.putalpha(shade)
    dr = ImageDraw.Draw(im)
    for f in front:
        if f["solid"]:
            dr.polygon([f["B0"], f["B1"], f["T1"], f["T0"]], fill=solid)
        else:
            for a, b in hatches(f):
                dr.line([a, b], fill=hatch, width=max(1, round(mw / 70)))
    return im.resize((px, px), Image.LANCZOS)


def gif(path, solid, hatch, inside, bg, seconds=3.0, fps=20, px=512):
    """A half turn on a solid background; it loops as a continuous rotation."""
    n = round(seconds * fps)
    frames = []
    for k in range(n):
        rgba = frame(k / n * math.pi, solid, hatch, inside, px)
        frames.append(Image.alpha_composite(Image.new("RGBA", rgba.size, bg), rgba).convert("RGB"))
    strip = Image.new("RGB", (px * n, px))                   # one palette from every frame,
    for k, f in enumerate(frames):                            # or colours missing from frame 0 get lost
        strip.paste(f, (k * px, 0))
    pal = strip.quantize(colors=256)
    out = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    out[0].save(path, save_all=True, append_images=out[1:], duration=round(1000 / fps), loop=0, optimize=False)


def favicon(yaw=math.radians(45), mw=100):
    """The browser-tab icon: black cube on light browser themes, white on dark ones.
    Small-size settings (4 x 4 strokes, about 1 px wide at 16 px), framed tight on the cube."""
    n = lambda p: f"{p[0]:.1f},{p[1]:.1f}"
    back, front = faces(yaw, mw)
    xs = [p[0] for f in back + front for p in (f["B0"], f["B1"], f["T1"], f["T0"])]
    ys = [p[1] for f in back + front for p in (f["B0"], f["B1"], f["T1"], f["T0"])]
    side = max(max(xs) - min(xs), max(ys) - min(ys)) + 4
    x0 = (min(xs) + max(xs) - side) / 2
    y0 = (min(ys) + max(ys) - side) / 2
    sw = side / 24                                          # thin enough to stay strokes at 16 px
    quad = lambda f: f'M{n(f["B0"])}L{n(f["B1"])}L{n(f["T1"])}L{n(f["T0"])}Z'
    parts = [f'<path class="i" d="{"".join(quad(f) for f in back)}"/>']
    for f in front:
        if f["solid"]:
            parts.append(f'<path class="s" d="{quad(f)}"/>')
        else:
            d = "".join(f"M{n(a)}L{n(b)}" for a, b in hatches(f, G=4, d=.1))
            parts.append(f'<path class="h" d="{d}" stroke-width="{sw:.2f}"/>')
    style = (f".s{{fill:{INK}}}.h{{fill:none;stroke:{INK}}}.i{{fill:{SHADE};fill-opacity:.12}}"
             f"@media (prefers-color-scheme:dark){{.s{{fill:{WHITE}}}.h{{stroke:{WHITE}}}.i{{fill-opacity:.45}}}}")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {side:.1f} {side:.1f}">'
            f"<style>{style}</style>" + "".join(parts) + "</svg>\n")


if __name__ == "__main__":
    (ROOT / "favicon.svg").write_text(favicon())
    (OUT / "svg").mkdir(parents=True, exist_ok=True)
    (OUT / "gif").mkdir(parents=True, exist_ok=True)
    for name, (solid, hatch, inside, bg) in COLOURWAYS.items():
        for deg in range(0, 180, 15):
            (OUT / "svg" / f"cube-{name}-{deg:03d}.svg").write_text(svg(math.radians(deg), solid, hatch, inside))
        gif(OUT / "gif" / f"cube-{name}-turn.gif", solid, hatch, inside, bg)
    print("svg:", len(list((OUT / "svg").glob("*.svg"))), "gif:", sorted(p.name for p in (OUT / "gif").glob("*.gif")))
