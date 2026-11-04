/* ---- the dotted ground of the minefield carries on under every section ---- */
/* one grid for the whole page: the method's tiles use the same columns (48 px squares on phones, 58 px elsewhere) */
export function initDottedGround() {
  const host = document.getElementById("dotted"), dots = document.getElementById("dots-bg");
  const draw = () => {
    const W = dots.clientWidth, size = W < 600 ? 48 : 58, cols = Math.ceil(W / size);
    const left0 = (W - cols * size) / 2, c = size / 2 - 1;
    dots.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + size + "' height='" + size + "'%3E%3Crect x='" + c + "' y='" + c + "' width='2' height='2' fill='%23A8A8A5'/%3E%3C/svg%3E\")";
    dots.style.backgroundPosition = left0 + "px 0px";
  };
  draw();
  if ("ResizeObserver" in window) new ResizeObserver(draw).observe(host);
  window.addEventListener("resize", draw);
}
