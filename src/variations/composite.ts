import Transform from "../transform.ts";
import AffineTransform from "./affine.ts";
import SwirlTransform from "./swirl.ts";
import SphericalTransform from "./spherical.ts";
import SinusoidalTransform from "./sinusoidal.ts";
import HorseshoeTransform from "./horseshoe.ts";
import BubbleTransform from "./bubble.ts";
import SpiralTransform from "./spiral.ts";
import HandkerchiefTransform from "./handkerchief.ts";
import PolarTransform from "./polar.ts";
import LinearTransform from "./linear.ts";

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

    return [addX, addY]
  }

  static random()
  {
    const affine = AffineTransform.random()

    // Available transform classes
    const availableTransforms = [
      //LinearTransform,
      SwirlTransform,
      SphericalTransform,
      //SinusoidalTransform,
      HorseshoeTransform,
      BubbleTransform,
      SpiralTransform,
      HandkerchiefTransform,
      //PolarTransform,
    ]

    // Randomly select 1-4 variations
    const numVariations = Math.floor(Math.random() * 2) + 1

    // Shuffle and select unique transforms
    const shuffled = [...availableTransforms].sort(() => Math.random() - 0.5)
    const selectedTransforms = shuffled.slice(0, numVariations)

    // Create variations with random weights
    const variations: [number, Transform][] = selectedTransforms.map(TransformClass => [
      Math.random() * 0.05,
      new TransformClass()
    ])

    const sum = variations.reduce((accumulator, currentValue) => accumulator + currentValue[0], 0);

    variations.unshift([1 - sum, new LinearTransform()])

    return new this(affine, variations)
  }
}
