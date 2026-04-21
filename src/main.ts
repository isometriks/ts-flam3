import "./style.css"
import Flame from "./flame.ts";

declare global {
  interface Window { flame: Flame }
}

const flame = new Flame(1500, 740)
window.flame = flame
flame.iterate(2000000);
flame.render();

window.setInterval(() => {
  flame.iterate(500000);
  flame.render();
}, 2000);
