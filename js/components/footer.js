import { CONTACT_EMAIL } from "../config.js";

/* ---- footer reveal: the page lifts off a dark footer fixed behind it ---- */
export function initFooter() {
  const spacer = document.getElementById("contact"), foot = document.getElementById("reveal");
  const fit = () => {
    foot.classList.remove("static");
    const h = foot.offsetHeight;
    if (h > window.innerHeight * .92) { foot.classList.add("static"); spacer.style.height = "0px"; }
    else spacer.style.height = h + "px";
  };
  fit();
  window.addEventListener("resize", fit);
  /* Impressum & privacy: opens over the page, closes with the button, Esc or a click outside */
  const legal = document.getElementById("impressum"), legalOpen = document.getElementById("imp-open");
  const showLegal = () => { if (!legal.open) { legal.showModal(); legal.querySelector(".legal-body").scrollTop = 0; } };
  legalOpen.addEventListener("click", e => { e.preventDefault(); showLegal(); });
  document.getElementById("imp-close").addEventListener("click", () => legal.close());
  legal.addEventListener("click", e => { if (e.target === legal) legal.close(); });
  legal.addEventListener("close", () => legalOpen.focus({ preventScroll: true }));
  /* a direct link to thecu.be/#impressum opens it straight away */
  const fromHash = () => { if (location.hash === "#impressum") showLegal(); };
  fromHash(); window.addEventListener("hashchange", fromHash);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  const btn = document.getElementById("r-copy"), mail = CONTACT_EMAIL;
  btn.addEventListener("click", () => {
    const ok = () => { btn.textContent = "Copied"; setTimeout(() => btn.textContent = "Copy address", 2000); };
    try { navigator.clipboard.writeText(mail).then(ok, () => {}); } catch (e) {}
  });
}
