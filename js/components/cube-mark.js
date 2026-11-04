import { reduce } from "../utils/motion.js";

/* ---- logo: one cube, one solid face, one hatched face ---- */
/* the same cube twice: large in the hero, small in the sticky bar; both start at the same angle */
export function initCubeMark() {
  /* a different angle on each visit: any quarter of the full turn, one of its steps (never fully front-on) */
  const yaw0 = (Math.floor(Math.random() * 4) * 16 + 1 + Math.floor(Math.random() * 15)) / 16 * Math.PI / 2;
  const text = document.getElementById("title-text");
  mountCube(document.getElementById("mark"), document.getElementById("mark-box"),
    () => Math.round(text.querySelector(".lockup").getBoundingClientRect().height), document.querySelector(".title"), yaw0);
  const barBox = document.getElementById("bar-mark-box");
  if (barBox) mountCube(document.getElementById("bar-mark"), barBox, () => barBox.clientHeight, document.querySelector(".bar-brand"), yaw0);
}

function mountCube(mk, box, height, hoverEl, startYaw) {
  const mc = mk.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue("--ink").trim() || "#141414";
  const acc = css.getPropertyValue("--accent").trim() || "#E4FE00";
  const D = 2.6;
  const INSIDE = .14; /* how dark the inside of the cube shows through the hatching */
  let mw = 0, yaw = startYaw;
  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const h = height();
    if (!h) return;
    box.style.width = box.style.height = h + "px";
    mw = h;
    mk.width = mk.height = Math.round(mw * dpr);
    mc.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const draw = () => {
    mc.clearRect(0, 0, mw, mw);
    const cx = mw / 2, cy = mw / 2, S = mw * .5;
    const pt = (a, y) => {
      const x = Math.SQRT1_2 * Math.sin(a), z = Math.SQRT1_2 * Math.cos(a), f = D / (D - z);
      return [cx + x * f * S, cy - y * f * S];
    };
    const fs = [], back = [];
    for (let fi = 0; fi < 4; fi++) {
      const th = yaw + fi * Math.PI / 2, nx = Math.sin(th), nz = Math.cos(th);
      const face = { solid: fi % 2 === 0, z: nz, B0: pt(th - Math.PI / 4, -.5), B1: pt(th + Math.PI / 4, -.5), T1: pt(th + Math.PI / 4, .5), T0: pt(th - Math.PI / 4, .5) };
      (nx * -.5 * nx + nz * (D - .5 * nz) <= 0 ? back : fs).push(face);
    }
    fs.sort((a, b) => a.z - b.z);
    /* the inside of the cube: the far faces, in a soft shade of ink, seen through the hatching */
    mc.beginPath();
    for (const f of back) { mc.moveTo(...f.B0); mc.lineTo(...f.B1); mc.lineTo(...f.T1); mc.lineTo(...f.T0); mc.closePath(); }
    mc.globalAlpha = INSIDE; mc.fillStyle = ink; mc.fill(); mc.globalAlpha = 1;
    mc.lineCap = "round"; mc.lineJoin = "round"; mc.strokeStyle = ink;
    for (const f of fs) {
      if (f.solid) {
        mc.beginPath(); mc.moveTo(...f.B0); mc.lineTo(...f.B1); mc.lineTo(...f.T1); mc.lineTo(...f.T0); mc.closePath();
        mc.fillStyle = acc; mc.fill();
      } else {
        mc.lineWidth = Math.max(1, mw / 70); mc.lineCap = "butt"; mc.beginPath();
        const G = mw > 64 ? 6 : 4, d = mw > 64 ? .055 : .085;
        for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
          const u = (i + .5) / G, v = (j + .5) / G;
          const at = (uu, vv) => lp(lp(f.B0, f.B1, uu), lp(f.T0, f.T1, uu), vv);
          mc.moveTo(...at(u - d, v - d)); mc.lineTo(...at(u + d, v + d));
        }
        mc.stroke();
      }
    }
  };
  size(); draw();
  window.addEventListener("resize", () => { size(); draw(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { size(); draw(); });

  /* pointing at the logo (cube or name) spins it; leaving lets it slow down and rest where it is */
  if (!hoverEl || reduce) return;
  const SPIN = Math.PI * 2 / 3; /* full speed: one turn every 3 s */
  let speed = 0, target = 0, last = 0, raf = 0;
  const step = t => {
    const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
    speed += (target - speed) * Math.min(1, dt * 4); /* eases in and out over about a second */
    yaw += speed * dt; draw();
    if (target || speed > .02) raf = requestAnimationFrame(step);
    else { raf = 0; last = 0; speed = 0; }
  };
  hoverEl.addEventListener("pointerenter", () => { target = SPIN; if (!raf) raf = requestAnimationFrame(step); });
  hoverEl.addEventListener("pointerleave", () => { target = 0; });
}
