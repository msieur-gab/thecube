import { reduce } from "../utils/motion.js";
import { PERSPECTIVES } from "../data/perspectives.js";

/* ---- the field: click a square, unfold a patch, land on a perspective ---- */
export function initField() {
  const hero = document.querySelector(".hero");
  const field = document.getElementById("field");
  const card = document.getElementById("card");
  const cardT = document.getElementById("card-title"), cardD = document.getElementById("card-text"), cardN = document.getElementById("card-n");
  const closeBtn = document.getElementById("card-close");
  const restartBtn = document.getElementById("restart");
  const sheet = document.querySelector(".sheet");
  const pad2 = n => String(n).padStart(2, "0");
  const MINE = 16, OPEN = 32;
  const MINE_DENSITY = .12; /* about one square in eight */
  const LOSE_AFTER = 2;      /* used only by the rigged loss, which is commented out below */
  let cols = 0, rows = 0, size = 0, val = [], voids = [], els = [], msgOf = {}, focusIdx = -1, lastIdx = -1, builtW = 0;
  let over = false, gen = 0, clicks = 0;

  /* n nearby flags shown as n small squares, in rows of up to three */
  const pips = n => n > 0 ? '<span class="num pips" style="--c:' + (n <= 3 ? n : n === 4 ? 2 : 3) + '" aria-hidden="true">' + "<i></i>".repeat(n) + "</span>" : '<span class="num"></span>';

  const neighbors = idx => {
    const x = idx % cols, y = Math.floor(idx / cols), out = [];
    for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
      if ((i || j) && x + j >= 0 && y + i >= 0 && x + j < cols && y + i < rows) out.push(x + j + (y + i) * cols);
    }
    return out;
  };

  const build = () => {
    const W = hero.clientWidth, H = hero.clientHeight;
    cols = Math.max(5, Math.floor(W / (W < 600 ? 48 : 58)));
    size = W / cols; rows = Math.ceil(H / size);
    field.style.setProperty("--size", size + "px");
    field.style.gridTemplateColumns = "repeat(" + cols + ", " + size + "px)";
    const hr = hero.getBoundingClientRect();
    const zones = [...hero.querySelectorAll("[data-clear]")].map(el => {
      const r = el.getBoundingClientRect();
      return [r.left - hr.left - 6, r.top - hr.top - 6, r.right - hr.left + 6, r.bottom - hr.top + 6];
    });
    field.innerHTML = ""; els = []; voids = []; val = new Array(cols * rows).fill(0); msgOf = {}; over = false; gen++; clicks = 0;
    const frag = document.createDocumentFragment();
    const offset = H - rows * size; /* zero or negative: the top row overflows */
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = c * size, y0 = offset + r * size;
      const blocked = zones.some(z => x0 < z[2] && x0 + size > z[0] && y0 < z[3] && y0 + size > z[1]);
      const el = document.createElement(blocked ? "div" : "button");
      el.className = "cell" + (blocked ? " void" : "");
      if (!blocked) { el.type = "button"; el.tabIndex = -1; el.setAttribute("aria-label", "Closed square"); }
      el.dataset.i = els.length;
      els.push(el); voids.push(blocked);
      frag.appendChild(el);
    }
    field.appendChild(frag);
    /* lay the perspectives like mines, then count neighbours */
    const pool = [];
    const safeRows = offset < -0.5 ? 1 : 0; /* the cut top row never holds a flag, as in the original */
    for (let i = safeRows * cols; i < val.length; i++) if (!voids[i]) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const count = Math.max(PERSPECTIVES.length, Math.round(pool.length * MINE_DENSITY));
    for (let i = 0; i < count; i++) { val[pool[i]] = MINE; msgOf[pool[i]] = i % PERSPECTIVES.length; }
    for (let i = 0; i < val.length; i++) if (val[i] !== MINE) val[i] = neighbors(i).reduce((n, k) => n + ((val[k] & MINE) ? 1 : 0), 0);
    focusIdx = voids.indexOf(false);
    if (focusIdx >= 0) els[focusIdx].tabIndex = 0;
  };

  const open = idx => {
    const v = val[idx];
    if (voids[idx] || (v & MINE) || (v & OPEN)) return;
    const n = v & 0x0F;
    val[idx] |= OPEN;
    const el = els[idx];
    el.classList.add("open");
    el.innerHTML = '<span class="reveal" aria-hidden="true"></span>' + pips(n);
    el.setAttribute("aria-label", n > 0 ? n + " perspectives nearby" : "Open square");
    const g = gen;
    if (n === 0) neighbors(idx).forEach((k, i) => setTimeout(() => { if (!over && g === gen) open(k); }, (i + 1) * 30));
  };

  const offerCard = document.getElementById("offer");
  const placeCard = idx => {
    const hr = hero.getBoundingClientRect();
    if (hero.clientWidth < 600) {
      /* phones: cover the offer card exactly, bottom edges aligned, buttons left visible */
      const o = offerCard.getBoundingClientRect();
      card.style.width = o.width + "px";
      card.style.left = (o.left - hr.left) + "px";
      card.style.top = (o.bottom - hr.top - card.offsetHeight) + "px";
      offerCard.classList.add("covered");
      return;
    }
    card.style.width = offerCard.offsetWidth + "px"; /* one card size, as on phones */
    offerCard.classList.remove("covered");
    const r = els[idx].getBoundingClientRect();
    const W = hero.clientWidth, H = hero.clientHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    let left = r.left - hr.left + r.width / 2 - cw / 2, top = r.bottom - hr.top + 24;
    if (top + ch > H - 10) top = r.top - hr.top - ch - 8;
    left = Math.max(10, Math.min(left, W - cw - 10));
    top = Math.max(10, Math.min(top, H - ch - 10));
    card.style.left = left + "px"; card.style.top = top + "px";
    card.style.transformOrigin = (r.left - hr.left + r.width / 2 - left) + "px " + (top < r.top - hr.top ? "100%" : "0");
  };
  const showCard = (idx, viaKeys) => {
    const m = msgOf[idx], P = PERSPECTIVES[m];
    cardT.textContent = P.t; cardD.textContent = P.d;
    cardN.textContent = pad2(m + 1) + " / " + pad2(PERSPECTIVES.length);
    card.hidden = false; placeCard(idx);
    card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop");
    lastIdx = idx;
    if (viaKeys) closeBtn.focus();
  };
  const hideCard = refocus => { card.hidden = true; offerCard.classList.remove("covered"); if (refocus && lastIdx >= 0) els[lastIdx].focus(); };

  field.addEventListener("click", e => {
    const el = e.target.closest(".cell");
    if (!el || el.classList.contains("void")) return;
    const idx = +el.dataset.i;
    setFocus(idx, false);
    let isMine = (val[idx] & MINE) === MINE;
    if (over) { if (isMine) showCard(idx, e.detail === 0); return; }
    if (val[idx] & OPEN) return;
    clicks++;
    /* rigged loss, switched off for now: uncomment to make click number LOSE_AFTER always find a flag
    if (!isMine && clicks >= LOSE_AFTER) { rigMine(idx); isMine = true; }
    */
    if (isMine) {
      markMine(idx);
      showCard(idx, e.detail === 0);
      gameOver(idx);
    } else {
      open(idx);
    }
  });

  /* move a hidden flag under the clicked square, without changing any number already shown */
  const rigMine = idx => {
    const mines = [];
    for (let i = 0; i < val.length; i++) if (val[i] & MINE) mines.push(i);
    const quiet = mines.filter(i => !neighbors(i).some(k => val[k] & OPEN));
    if (quiet.length) {
      const from = quiet[Math.floor(Math.random() * quiet.length)];
      msgOf[idx] = msgOf[from]; delete msgOf[from]; val[from] = 0;
    } else {
      msgOf[idx] = mines.length % PERSPECTIVES.length;
    }
    val[idx] = MINE;
    for (let i = 0; i < val.length; i++) {
      if (val[i] & MINE) continue;
      const openBit = val[i] & OPEN;
      val[i] = neighbors(i).reduce((n, k) => n + ((val[k] & MINE) ? 1 : 0), 0) | openBit;
    }
    neighbors(idx).forEach(k => {
      if (!(val[k] & OPEN)) return;
      const num = els[k].querySelector(".num"), n = val[k] & 0x0F;
      if (num) num.outerHTML = pips(n);
      els[k].setAttribute("aria-label", n > 0 ? n + " perspectives nearby" : "Open square");
    });
  };

  const markMine = idx => {
    const el = els[idx];
    el.classList.add("mine");
    el.setAttribute("aria-label", "Perspective: " + PERSPECTIVES[msgOf[idx]].t);
  };
  /* one flag found: the whole grid unfolds outward from it */
  const gameOver = idx => {
    if (over) return;
    over = true;
    const g = gen, oc = idx % cols, or = Math.floor(idx / cols);
    let maxDelay = 0;
    for (let i = 0; i < val.length; i++) {
      if (voids[i] || (val[i] & OPEN) || i === idx) continue;
      const delay = Math.hypot(i % cols - oc, Math.floor(i / cols) - or) * 25;
      if (delay > maxDelay) maxDelay = delay;
      setTimeout(() => {
        if (g !== gen) return;
        if (val[i] & MINE) { markMine(i); return; }
        const n = val[i] & 0x0F;
        val[i] |= OPEN;
        els[i].classList.add("open");
        els[i].innerHTML = '<span class="reveal" aria-hidden="true"></span>' + pips(n);
        els[i].setAttribute("aria-label", n > 0 ? n + " perspectives nearby" : "Open square");
      }, reduce ? 0 : delay);
    }
    /* the page takes the open colour only once the wave has passed */
    setTimeout(() => { if (g === gen) sheet.classList.add("unfolded"); }, reduce ? 0 : maxDelay + 350);
    setTimeout(() => { if (g === gen) restartBtn.hidden = false; }, 1500);
  };
  restartBtn.addEventListener("click", () => { init(); });

  /* a small "click me" follows the pointer over closed squares, until the first click */
  const tip = document.getElementById("clickme");
  let clicked = false;
  const noHover = window.matchMedia("(hover: none)").matches;
  const placeTipOnCell = () => {
    if (clicked || !noHover) return;
    const W = hero.clientWidth;
    const tr = Math.round(rows * .55), tc = Math.round(cols * (W >= 820 ? .65 : .5));
    let best = -1, bd = 1e9;
    for (let i = 0; i < els.length; i++) { if (voids[i]) continue; const d = Math.hypot(Math.floor(i / cols) - tr, i % cols - tc); if (d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    const hr = hero.getBoundingClientRect(), r = els[best].getBoundingClientRect();
    tip.textContent = "Tap me";
    tip.style.transform = "translate(" + (r.left - hr.left + r.width * .5) + "px," + (r.top - hr.top + r.height * .5) + "px)";
    tip.classList.add("on");
  };
  field.addEventListener("pointermove", e => {
    if (clicked || e.pointerType === "touch") return;
    const el = e.target.closest(".cell");
    const show = el && !el.classList.contains("void") && !el.classList.contains("open") && !el.classList.contains("mine");
    tip.classList.toggle("on", !!show);
    if (!show) return;
    const hr = hero.getBoundingClientRect();
    tip.style.transform = "translate(" + (e.clientX - hr.left + 14) + "px," + (e.clientY - hr.top + 16) + "px)";
  });
  field.addEventListener("pointerleave", () => tip.classList.remove("on"));
  field.addEventListener("click", () => { clicked = true; tip.classList.remove("on"); }, true);
  closeBtn.addEventListener("click", () => hideCard(true));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !card.hidden) hideCard(true); });

  /* arrow keys move through the squares */
  const setFocus = (i, move = true) => {
    if (i < 0 || voids[i] !== false) return;
    if (focusIdx >= 0 && els[focusIdx]) els[focusIdx].tabIndex = -1;
    focusIdx = i; els[i].tabIndex = 0;
    if (move) els[i].focus();
  };
  field.addEventListener("keydown", e => {
    const d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!d || focusIdx < 0) return;
    e.preventDefault();
    let r = Math.floor(focusIdx / cols), c = focusIdx % cols;
    for (let step = 0; step < Math.max(rows, cols); step++) {
      r += d[0]; c += d[1];
      if (r < 0 || c < 0 || r >= rows || c >= cols) return;
      const i = r * cols + c;
      if (!voids[i]) { setFocus(i); return; }
    }
  });

  const init = () => { builtW = hero.clientWidth; card.hidden = true; offerCard.classList.remove("covered"); restartBtn.hidden = true; sheet.classList.remove("unfolded"); build(); if (typeof placeTipOnCell === "function") placeTipOnCell(); };
  init();
  placeTipOnCell();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!val.some(v => v & OPEN) && card.hidden) build(); });
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (Math.abs(hero.clientWidth - builtW) > 40) init();
      else if (!card.hidden && lastIdx >= 0) placeCard(lastIdx);
    }, 120);
  });
}
