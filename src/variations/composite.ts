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

    // Available transform classes
    const availableTransforms = [
      SwirlTransform,
      SphericalTransform,
      SinusoidalTransform,
      HorseshoeTransform,
      BubbleTransform,
      SpiralTransform,
      HandkerchiefTransform,
      PolarTransform,
    ]

    // Randomly select 1-4 variations
    const numVariations = Math.floor(Math.random() * 4) + 1

    // Shuffle and select unique transforms
    const shuffled = [...availableTransforms].sort(() => Math.random() - 0.5)
    const selectedTransforms = shuffled.slice(0, numVariations)

    // Draw raw weights in [0, 1), then normalize so they sum to 1. This keeps
    // the overall variation magnitude consistent regardless of how many were
    // selected, while still letting one variation dominate when it happens to
    // draw a much larger raw weight than the others.
    const rawWeights = selectedTransforms.map(() => Math.random())
    const total = rawWeights.reduce((sum, w) => sum + w, 0) || 1

    const variations: [number, Transform][] = selectedTransforms.map((TransformClass, i) => [
      rawWeights[i] / total,
      new TransformClass(),
    ])

    return new this(affine, variations)
  }
}
