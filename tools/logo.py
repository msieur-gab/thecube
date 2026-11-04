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

INK, ACCENT, WHITE = "#141414", "#E4FE00", "#FFFFFF"
COLOURWAYS = {               # name: (solid face, hatching)
    "yellow-black": (ACCENT, INK),
    "black": (INK, INK),
    "white": (WHITE, WHITE),
}
D = 2.6                      # camera distance, as on the page


def faces(yaw, mw):
    """Visible faces, back to front, in a mw x mw box (same maths as cube-mark.js)."""
    cx = cy = mw / 2
    S = mw * .5

    def pt(a, y):
        x, z = math.sqrt(.5) * math.sin(a), math.sqrt(.5) * math.cos(a)
        f = D / (D - z)
        return (cx + x * f * S, cy - y * f * S)

    fs = []
    for fi in range(4):
        th = yaw + fi * math.pi / 2
        nx, nz = math.sin(th), math.cos(th)
        if nx * -.5 * nx + nz * (D - .5 * nz) <= 0:
            continue
        fs.append({"solid": fi % 2 == 0, "z": nz,
                   "B0": pt(th - math.pi / 4, -.5), "B1": pt(th + math.pi / 4, -.5),
                   "T1": pt(th + math.pi / 4, .5), "T0": pt(th - math.pi / 4, .5)})
    fs.sort(key=lambda f: f["z"])
    return fs


def lp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def hatches(f, G=6, d=.055):
    """The short diagonal strokes of a hatched face (large-size settings of cube-mark.js)."""
    at = lambda uu, vv: lp(lp(f["B0"], f["B1"], uu), lp(f["T0"], f["T1"], uu), vv)
    for i in range(G):
        for j in range(G):
            u, v = (i + .5) / G, (j + .5) / G
            yield at(u - d, v - d), at(u + d, v + d)


def svg(yaw, solid, hatch, mw=100):
    n = lambda p: f"{p[0]:.2f},{p[1]:.2f}"
    parts = []
    for f in faces(yaw, mw):
        if f["solid"]:
            parts.append(f'<path d="M{n(f["B0"])}L{n(f["B1"])}L{n(f["T1"])}L{n(f["T0"])}Z" fill="{solid}"/>')
        else:
            d = "".join(f"M{n(a)}L{n(b)}" for a, b in hatches(f))
            parts.append(f'<path d="{d}" fill="none" stroke="{hatch}" stroke-width="{mw / 70:.3f}" stroke-linecap="butt"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {mw} {mw}" width="{mw * 5}" height="{mw * 5}">'
            + "".join(parts) + "</svg>\n")


def frame(yaw, solid, hatch, px=512, ss=4):
    """One RGBA frame, drawn at ss times the size and scaled down for smooth edges."""
    mw = px * ss
    im = Image.new("RGBA", (mw, mw), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    for f in faces(yaw, mw):
        if f["solid"]:
            dr.polygon([f["B0"], f["B1"], f["T1"], f["T0"]], fill=solid)
        else:
            for a, b in hatches(f):
                dr.line([a, b], fill=hatch, width=max(1, round(mw / 70)))
    return im.resize((px, px), Image.LANCZOS)


def gif(path, solid, hatch, matte, seconds=3.0, fps=20, px=512):
    """A half turn that loops as a continuous rotation; transparent outside the cube.
    GIF transparency is on/off, so soft edges are blended onto `matte` (the background it suits)."""
    n = round(seconds * fps)
    mr, mg, mb = Image.new("RGB", (1, 1), matte).getpixel((0, 0))
    frames = []
    for k in range(n):
        rgba = frame(k / n * math.pi, solid, hatch, px)
        bg = Image.new("RGBA", rgba.size, (mr, mg, mb, 255))
        flat = Image.alpha_composite(bg, rgba).convert("RGB")
        clear = rgba.getchannel("A").point(lambda a: 255 if a < 96 else 0)
        frames.append((flat, clear))
    strip = Image.new("RGB", (px * len(frames), px))         # one palette from every frame,
    for k, (flat, _) in enumerate(frames):                    # or colours missing from frame 0 get lost
        strip.paste(flat, (k * px, 0))
    pal = strip.quantize(colors=255)
    out = []
    for flat, clear in frames:
        p = flat.quantize(palette=pal, dither=Image.Dither.NONE)
        p.paste(255, mask=clear)
        out.append(p)
    palette = pal.getpalette()[:255 * 3] + [mr, mg, mb]
    for p in out:
        p.putpalette(palette)
    out[0].save(path, save_all=True, append_images=out[1:], duration=round(1000 / fps), loop=0,
                transparency=255, disposal=2, optimize=False)


if __name__ == "__main__":
    (OUT / "svg").mkdir(parents=True, exist_ok=True)
    (OUT / "gif").mkdir(parents=True, exist_ok=True)
    for name, (solid, hatch) in COLOURWAYS.items():
        for deg in range(0, 180, 15):
            (OUT / "svg" / f"cube-{name}-{deg:03d}.svg").write_text(svg(math.radians(deg), solid, hatch))
        matte = INK if name == "white" else WHITE
        gif(OUT / "gif" / f"cube-{name}-turn.gif", solid, hatch, matte)
    print("svg:", len(list((OUT / "svg").glob("*.svg"))), "gif:", sorted(p.name for p in (OUT / "gif").glob("*.gif")))
