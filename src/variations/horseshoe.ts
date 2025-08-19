import Transform from "../transform.ts";

export default class HorseshoeTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r = Math.hypot(x, y);
    if (r === 0) return [0, 0];
    const xr = (x * x - y * y) / r; // (x^2 - y^2)/r
    const yr = (2 * x * y) / r;    // (2xy)/r
    return [xr, yr];
  }
}
