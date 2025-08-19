import Transform from "../transform.ts";

export default class PolarTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r = Math.hypot(x, y);
    const theta = Math.atan2(y, x);
    return [theta / Math.PI, r - 1];
  }
}
