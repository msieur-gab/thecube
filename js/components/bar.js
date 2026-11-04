/* ---- sticky bar: shows once the hero's buttons have scrolled away, steps aside at the contact footer ---- */
export function initBar() {
  const bar = document.getElementById("bar");
  const heroActions = document.querySelector(".hero .actions"), contact = document.getElementById("contact");
  if (!bar || !heroActions || !contact || !("IntersectionObserver" in window)) return;
  let pastHero = false, atFooter = false;
  const set = () => { const on = pastHero && !atFooter; bar.classList.toggle("on", on); bar.inert = !on; };
  /* past the hero = its buttons have left the screen through the top */
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(heroActions);
  /* the dark footer carries its own "write to me": the bar leaves once half of it is showing */
  new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; set(); }, { threshold: .5 }).observe(contact);
}
