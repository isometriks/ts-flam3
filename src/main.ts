import "./style.css"
import Flame from "./flame.ts";

const flame = new Flame(1600, 1200)
flame.iterate(1000000);
flame.render();

window.setInterval(() => {
  flame.iterate(1000000);
  flame.render();
}, 1000);

window.flame = flame;
