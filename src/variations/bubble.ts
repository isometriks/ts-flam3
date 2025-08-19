import Transform from "../transform.ts";

export default class BubbleTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r2 = x * x + y * y;
    const k = 4 / (r2 + 4); // Standard bubble scaling
    return [k * x, k * y];
  }
}
