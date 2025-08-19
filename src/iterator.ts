import Histogram from "./histogram.ts"
import Color from "./color.ts"
import Transform from "./transform.ts"
import AffineTransform from "./variations/affine.ts"
import SphericalTransform from "./variations/spherical.ts";
import SwirlTransform from "./variations/swirl.ts";
import CompositeTransform from "./variations/composite.ts";

export default class Iterator {
  histogram: Histogram
  transforms: Transform[] = []
  colors: Color[] = []
  color: Color = new Color()
  x = 0
  y = 0

  constructor(histogram: Histogram) {
    this.histogram = histogram;

    for (let i=0; i<(3 + Math.random() * 3); i++) {
      this.transforms[i] = CompositeTransform.random()
      this.colors[i] = Color.random()
    }

    this.x = Math.random() * 2 - 1
    this.y = Math.random() * 2 - 1
  }

  iterate(iterations: number) {
    const rotation = AffineTransform.rotation(Math.PI / 4)

    for (let i = 0; i < iterations; i++) {
      if (Math.round(Math.random()*1) === 0) {
        this.#applyTransform(rotation, this.color);
      }

      const f = Math.round(Math.random() * (this.transforms.length - 1))
      const color = this.colors[f];
      const transform = this.transforms[f];

      this.#applyTransform(transform, color);
    }
  }

  #applyTransform(transform: Transform, color: Color) {
    this.color = this.color.mix(color);

    [this.x, this.y] = transform.apply(this.x, this.y);

    this.histogram.plot(this.x, this.y, this.color);
  }
}
