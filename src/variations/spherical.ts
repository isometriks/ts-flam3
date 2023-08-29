import Transform from "../transform.ts";

export default class SphericalTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r = 1/Math.sqrt(x**2 + y**2)**2

    return [x*r, y*r];
  }
}
