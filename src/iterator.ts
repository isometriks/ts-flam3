import Histogram from "./histogram.ts"
import Color from "./color.ts"
import Transform from "./transform.ts"
import AffineTransform from "./variations/affine.ts"
import SphericalTransform from "./variations/spherical.ts";
import SwirlTransform from "./variations/swirl.ts";

export default class Iterator {
  histogram: Histogram
  transforms: Transform[] = []
  colors: Color[] = []
  color: Color = new Color()
  x = 0
  y = 0

  constructor(histogram: Histogram) {
    this.histogram = histogram;

    for (let i=0; i<5; i++) {
      this.transforms[i] = AffineTransform.random()
      this.colors[i] = Color.random()
    }
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

    const variations= [
      [0.15, new SwirlTransform()],
      // [0.0005, new SphericalTransform()],
    ] as [number, Transform][]

    let [addX, addY] = [0, 0]

    for (const [weight, variation] of variations) {
      const [vx, vy] = variation.apply(this.x, this.y)

      addX += vx * weight
      addY += vy * weight
    }

    this.x += addX;
    this.y += addY;

    this.histogram.plot(this.x, this.y, this.color);
  }
}
