import Transform from "../transform.ts";

export default class SinusoidalTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    return [Math.sin(x), Math.sin(y)];
  }
}
