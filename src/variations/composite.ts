import Transform from "../transform.ts";
import AffineTransform from "./affine.ts";
import SwirlTransform from "./swirl.ts";
import SphericalTransform from "./spherical.ts";

export default class CompositeTransform implements Transform {
  #affine: AffineTransform;
  readonly #variations: [number, Transform][];

  constructor(affine: AffineTransform, variations: [number, Transform][]) {
    this.#affine = affine
    this.#variations = variations
  }

  apply(x: number, y: number): [number, number] {
    [x, y] = this.#affine.apply(x, y)
    let [addX, addY] = [0, 0]

    for (const [weight, variation] of this.#variations) {
      const [vx, vy] = variation.apply(x, y)

      addX += vx * weight
      addY += vy * weight
    }

    return [x + addX, y + addY]
  }

  static random()
  {
    const affine = AffineTransform.random()
    const variations: [number, Transform][] = [
      [Math.random()*.02, new SwirlTransform()],
      [Math.random()*.03, new SphericalTransform()],
    ]

    return new this(affine, variations)
  }
}
