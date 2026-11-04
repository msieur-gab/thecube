import { TZ, TALK_DATE, FREE_FROM } from "../config.js";

/* Munich clock */
export function initNow() {
  const fmtTime = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const tick = () => { const t = fmtTime.format(new Date()); document.querySelectorAll("[data-clock]").forEach(e => e.textContent = t); };
  tick(); setInterval(tick, 15000);

  /* lecture countdown, in Berlin calendar days */
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = k => +parts.find(p => p.type === k).value;
  const days = Math.round((Date.UTC(TALK_DATE[0], TALK_DATE[1] - 1, TALK_DATE[2]) - Date.UTC(get("year"), get("month") - 1, get("day"))) / 864e5);
  const chip = document.getElementById("countdown");
  chip.textContent = days > 1 ? "In " + days + " days" : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Given";

  /* availability: booked until this Berlin date, then open for new briefs */
  const toFree = Math.round((Date.UTC(FREE_FROM[0], FREE_FROM[1] - 1, FREE_FROM[2]) - Date.UTC(get("year"), get("month") - 1, get("day"))) / 864e5);
  if (toFree <= 0) document.getElementById("booked").textContent = "Available now";
}
