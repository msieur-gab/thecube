import { reduce } from "../utils/motion.js";

/* ---- what: a step opens a patch of tiles in the background, like the field ---- */
export function initMethodField() {
  const section = document.getElementById("what");
  const field = document.getElementById("what-field");
  const items = [...document.querySelectorAll("#steps li")];
  let cols = 0, rows = 0, size = 58, cells = [];
  const build = () => {
    const W = field.clientWidth, H = field.clientHeight;
    size = W < 600 ? 48 : 58;
    cols = Math.ceil(W / size); rows = Math.ceil(H / size);
    field.style.setProperty("--size", size + "px");
    field.style.gridTemplateColumns = "repeat(" + cols + ", " + size + "px)";
    field.innerHTML = ""; cells = [];
    const frag = document.createDocumentFragment();
    for (let k = 0; k < cols * rows; k++) { const c = document.createElement("i"); frag.appendChild(c); cells.push(c); }
    field.appendChild(frag);
    align();
  };
  /* one grid for the whole page: the dotted ground and the method's tiles share columns and rows */
  const host = document.getElementById("dotted"), dots = document.getElementById("dots-bg");
  function align() {
    const W = field.clientWidth, left0 = (W - cols * size) / 2;
    const off = section.getBoundingClientRect().top - host.getBoundingClientRect().top;
    field.style.top = -(((off % size) + size) % size) + "px";
    const c = size / 2 - 1;
    dots.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + size + "' height='" + size + "'%3E%3Crect x='" + c + "' y='" + c + "' width='2' height='2' fill='%23A8A8A5'/%3E%3C/svg%3E\")";
    dots.style.backgroundPosition = left0 + "px 0px";
  }
  if ("ResizeObserver" in window) new ResizeObserver(() => align()).observe(host);
  const close = () => cells.forEach(c => { if (c.classList.contains("open")) { c.classList.remove("open", "mine"); c.style.removeProperty("--d"); } });
  /* open tiles in a wave around a point (viewport coordinates) */
  const reveal = (px, py) => {
    close();
    const fr = field.getBoundingClientRect();
    const left0 = fr.left + (fr.width - cols * size) / 2;
    const x = px - left0, y = py - fr.top, R = 3.2;
    cells.forEach((c, k) => {
      const cx = (k % cols + .5) * size, cy = (Math.floor(k / cols) + .5) * size;
      const d = Math.hypot(cx - x, cy - y) / size;
      if (d > R + (Math.random() - .5) * 1.2) return;
      c.style.setProperty("--d", reduce ? "0ms" : Math.round(d * 40) + "ms");
      void c.offsetWidth;
      c.classList.add("open");
      if (Math.random() < .1) c.classList.add("mine");
    });
  };
  const setOn = li => items.forEach(x => x.classList.toggle("on", x === li));
  build();
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 150); });

  const canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    items.forEach(li => li.addEventListener("pointerenter", e => { setOn(li); reveal(e.clientX, e.clientY); }));
    document.getElementById("steps").addEventListener("pointerleave", () => { setOn(null); close(); });
  } else if ("IntersectionObserver" in window) {
    /* phones: the step in the middle of the screen opens its patch */
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const li = en.target, h = li.querySelector("h3").getBoundingClientRect();
      setOn(li); reveal(h.left + h.width / 2, h.top + h.height / 2);
    }), { rootMargin: "-45% 0px -45% 0px" });
    items.forEach(li => io.observe(li));
  }
}
