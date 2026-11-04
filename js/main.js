/* the cube: each part of the page starts in the order of the original single page */
import { initNow } from "./components/now.js";
import { initOffer } from "./components/offer.js";
import { initCubeMark } from "./components/cube-mark.js";
import { initField } from "./components/field.js";
import { initFooter } from "./components/footer.js";
import { initTypedWord } from "./components/typed-word.js";
import { initEvidence } from "./components/evidence.js";
import { initMethodField } from "./components/method-field.js";

/* one part failing never stops the others */
for (const init of [initNow, initOffer, initCubeMark, initField, initFooter, initTypedWord, initEvidence, initMethodField]) {
  try { init(); } catch (err) { console.error("[the cube] " + init.name + " failed:", err); }
}
