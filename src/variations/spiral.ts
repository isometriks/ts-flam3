import Transform from "../transform.ts";

export default class SpiralTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const theta = Math.atan2(y, x);
    const denom = r === 0 ? 1e-6 : r;
    const nx = (Math.cos(theta) + Math.sin(r)) / denom;
    const ny = (Math.sin(theta) - Math.cos(r)) / denom;
    return [nx, ny];
  }
}
