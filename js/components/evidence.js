import { reduce } from "../utils/motion.js";

export function initEvidence() {
  const STEP_MS = 16; /* one tile every 16 ms: the counters pile up in about 1.5 s */
  /* ---- why: a carousel of evidence; tiles pile up and digits spin when a card comes round ---- */
  const ev = document.getElementById("evidence"), track = document.getElementById("ev-track");
  const cards = [...track.querySelectorAll(".ev-card")];
  const marks = [...ev.querySelectorAll(".ev-marks button")];
  const order = []; /* bottom-left first, row by row upward */
  for (let r = 9; r >= 0; r--) for (let c = 0; c < 10; c++) order.push(r * 10 + c);
  cards.forEach(cd => {
    const tiles = cd.querySelector(".tiles");
    for (let i = 0; i < 100; i++) tiles.appendChild(document.createElement("i"));
    cd._cells = [...tiles.children];
    const v = +cd.dataset.value || 0;
    if (!v) return;
    const full = Math.floor(v), half = v - full >= .5;
    cd._lit = () => { order.slice(0, full).forEach(i => cd._cells[i].classList.add("lit")); if (half) cd._cells[order[full]].classList.add("half"); };
    if (reduce) cd._lit();  /* without motion, show the answer straight away */
    /* number as spinning reels: each digit a strip of 0–9, three times over */
    const num = cd.querySelector(".num");
    num.innerHTML = "";
    cd._reels = cd.dataset.value.split("").map(ch => {
      if (ch === ".") { const dot = document.createElement("span"); dot.className = "dot-sep"; dot.textContent = "."; num.appendChild(dot); return null; }
      const dg = document.createElement("span"); dg.className = "digit";
      const reel = document.createElement("span"); reel.className = "reel";
      for (let k = 0; k < 30; k++) { const sp = document.createElement("span"); sp.textContent = k % 10; reel.appendChild(sp); }
      reel.style.transform = reduce ? "translateY(-" + (20 + +ch) + "em)" : "translateY(0)"; /* counters start at zero */
      dg.appendChild(reel); num.appendChild(dg);
      return { reel, d: +ch };
    }).filter(Boolean);
  });
  /* back to zero: empty tiles, counters at 0 */
  const reset = cd => {
    if (!cd._cells || reduce) return;
    cd._cells.forEach(c => { c.classList.remove("lit", "half"); c.style.removeProperty("--d"); });
    (cd._reels || []).forEach(r => { r.reel.style.transition = "none"; r.reel.style.transitionDelay = ""; r.reel.style.transform = "translateY(0)"; });
  };
  const play = cd => {
    const v = +cd.dataset.value || 0;
    if (!v || reduce) return;
    cd._cells.forEach(c => { c.classList.remove("lit", "half"); c.style.removeProperty("--d"); });
    cd._reels.forEach(r => { r.reel.style.transition = "none"; r.reel.style.transform = "translateY(0)"; });
    void cd.offsetWidth;
    const full = Math.floor(v);
    order.slice(0, full).forEach((i, k) => { const c = cd._cells[i]; c.style.setProperty("--d", k * 14 + "ms"); c.classList.add("lit"); });
    if (v - full >= .5) { const c = cd._cells[order[full]]; c.style.setProperty("--d", full * 14 + "ms"); c.classList.add("half"); }
    cd._reels.forEach((r, k) => {
      r.reel.style.transition = "";
      r.reel.style.transitionDelay = k * 140 + "ms";
      r.reel.style.transform = "translateY(-" + (20 + r.d) + "em)";
    });
  };
  let idx = 0, inView = false, holdUntil = 0, hover = false, playedIdx = -1;
  const mark = () => marks.forEach((m, j) => m.setAttribute("aria-current", j === idx ? "true" : "false"));
  /* let the track break out of the column to the full screen width */
  const setBleed = () => {
    const left = Math.max(0, ev.getBoundingClientRect().left);
    track.style.setProperty("--bleed", left + "px");
    track.style.setProperty("--vw", document.documentElement.clientWidth + "px");
    track.style.setProperty("--card", Math.round(Math.min(640, ev.clientWidth * .88)) + "px");
  };
  setBleed();
  const step = () => cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
  const go = k => { idx = (k + cards.length) % cards.length; track.scrollTo({ left: idx * step(), behavior: reduce ? "auto" : "smooth" }); mark(); };
  /* each card animates once, the first time it reaches the centre, then stays filled */
  const done = new Set();
  const maybePlay = () => {
    if (!inView || done.has(idx)) return;
    done.add(idx); playedIdx = idx;
    play(cards[idx]);
  };
  let st = 0;
  track.addEventListener("scroll", () => {
    const k = Math.round(track.scrollLeft / step());
    if (k !== idx) { idx = Math.max(0, Math.min(cards.length - 1, k)); mark(); }
    clearTimeout(st); st = setTimeout(maybePlay, 120);
  }, { passive: true });
  marks.forEach((m, j) => m.addEventListener("click", () => { holdUntil = performance.now() + 9000; go(j); }));
  ["pointerdown", "wheel", "touchstart", "keydown"].forEach(e => track.addEventListener(e, () => { holdUntil = performance.now() + 9000; }, { passive: true }));
  ev.addEventListener("pointerenter", () => { hover = true; });
  ev.addEventListener("pointerleave", () => { hover = false; });
  window.addEventListener("resize", () => { setBleed(); track.scrollTo({ left: idx * step() }); });
  mark();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) maybePlay(); }, { threshold: .45 }).observe(track);
  }
  const AUTOPLAY = false; /* paused while the cards are being reviewed; set to true to advance every 6.5 s */
  if (AUTOPLAY && !reduce) setInterval(() => { if (!inView || hover || document.hidden || performance.now() < holdUntil) return; go(idx + 1); }, 6500);
}
