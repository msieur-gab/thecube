import { PERSPECTIVES } from "../data/perspectives.js";

/* ---- one card size: the offer card and the perspective card share one height ---- */
/* the height of the tallest of them all (the offer, or any of the perspectives) at the current width,
   so a perspective opened on a phone lands exactly on the offer card */
export function initOneCard() {
  const root = document.documentElement, offer = document.getElementById("offer");
  const card = document.getElementById("card");
  const measure = () => {
    root.style.setProperty("--card-h", "0px");
    const w = offer.offsetWidth;
    let h = offer.offsetHeight;
    /* an invisible copy of the perspective card, filled with each perspective in turn */
    const probe = card.cloneNode(true);
    probe.removeAttribute("id"); probe.removeAttribute("hidden"); probe.removeAttribute("role");
    probe.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "left:-9999px;top:0;visibility:hidden;width:" + w + "px";
    card.parentNode.appendChild(probe);
    const [t, d] = probe.querySelectorAll("h2, p");
    for (const P of PERSPECTIVES) { t.textContent = P.t; d.textContent = P.d; h = Math.max(h, probe.offsetHeight); }
    probe.remove();
    root.style.setProperty("--card-h", Math.ceil(h) + "px");
  };
  measure();
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 100); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
}
