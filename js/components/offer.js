import { reduce } from "../utils/motion.js";

/* ---- offer card: slides advance on their own, can be swiped or picked ---- */
export function initOffer() {
  const offer = document.getElementById("offer"), track = document.getElementById("offer-track");
  const dots = [...offer.querySelectorAll(".offer-dots button")], n = dots.length;
  let i = 0, holdUntil = 0, hover = false;
  const mark = () => dots.forEach((d, j) => d.setAttribute("aria-current", j === i ? "true" : "false"));
  const go = k => { i = (k + n) % n; track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" }); mark(); };
  track.addEventListener("scroll", () => { const k = Math.round(track.scrollLeft / track.clientWidth); if (k !== i) { i = k; mark(); } }, { passive: true });
  dots.forEach((d, j) => d.addEventListener("click", () => { holdUntil = performance.now() + 9000; go(j); }));
  ["pointerdown", "wheel", "touchstart", "keydown"].forEach(ev => track.addEventListener(ev, () => { holdUntil = performance.now() + 9000; }, { passive: true }));
  offer.addEventListener("pointerenter", () => { hover = true; });
  offer.addEventListener("pointerleave", () => { hover = false; });
  offer.addEventListener("focusin", () => { holdUntil = performance.now() + 9000; });
  window.addEventListener("resize", () => { track.scrollTo({ left: i * track.clientWidth }); });
  mark();
  if (!reduce) setInterval(() => { if (hover || document.hidden || performance.now() < holdUntil) return; go(i + 1); }, 4500);
}
