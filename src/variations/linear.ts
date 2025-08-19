import Transform from "../transform.ts";

export default class LinearTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    return [x, y]
  }
}
