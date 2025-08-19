import Transform from "../transform.ts";

export default class HandkerchiefTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r = Math.hypot(x, y);
    const theta = Math.atan2(y, x);
    const nx = r * Math.sin(theta + r);
    const ny = r * Math.cos(theta - r);
    return [nx, ny];
  }
}
