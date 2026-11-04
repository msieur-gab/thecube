import { reduce } from "../utils/motion.js";

/* ---- why headline: the changing word is deleted and retyped ---- */
export function initTypedWord() {
  const WORDS = ["customers", "users", "employees", "clients"]; /* edit the list here */
  const w = document.querySelector(".swap-w");
  if (!w || reduce) return;
  const TYPE = 85, DELETE = 45, HOLD = 2200, GAP = 260;
  let k = 0;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const run = async () => {
    w.classList.add("typing");
    for (;;) {
      await wait(HOLD);
      while (document.hidden) await wait(500);
      const word = w.textContent;
      for (let n = word.length; n > 0; n--) { w.textContent = word.slice(0, n - 1); await wait(DELETE); }
      await wait(GAP);
      k = (k + 1) % WORDS.length;
      const next = WORDS[k];
      for (let n = 1; n <= next.length; n++) { w.textContent = next.slice(0, n); await wait(TYPE + Math.random() * 40); }
    }
  };
  run();
}
