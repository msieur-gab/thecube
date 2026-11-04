/* ---- the baseline under the name runs exactly as long as "the cube" above it ---- */
export function initBaseline() {
  const name = document.querySelector(".lockup span"), base = document.querySelector(".baseline");
  if (!name || !base) return;
  const fit = () => {
    base.style.fontSize = "";
    const w = name.getBoundingClientRect().width, b = base.getBoundingClientRect().width;
    if (w && b) base.style.fontSize = (parseFloat(getComputedStyle(base).fontSize) * w / b).toFixed(2) + "px";
  };
  fit();
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fit, 100); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}
