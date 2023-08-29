import "./style.css"
import Flame from "./flame.ts";

const flame = new Flame(1400, 850)
flame.iterate(100000);
flame.render();

window.setInterval(() => {
  flame.iterate(10000);
  flame.render();
}, 120);
