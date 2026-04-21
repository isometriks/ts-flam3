import Histogram from "./histogram.ts"
import Color from "./color.ts"
import Palette from "./palette.ts"
import Transform from "./transform.ts"
import CompositeTransform from "./variations/composite.ts"

export default class Iterator {
  histogram: Histogram
  transforms: Transform[] = []
  colorCoords: number[] = []
  palette: Palette
  c: number = 0
  x = 0
  y = 0
  #scratchColor: Color = new Color()

  constructor(histogram: Histogram) {
    this.histogram = histogram;
    this.palette = Palette.random();

    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      this.transforms.push(CompositeTransform.random());
      this.colorCoords.push(Math.random());
    }

    this.x = Math.random() * 2 - 1
    this.y = Math.random() * 2 - 1
    this.c = Math.random()
  }

  iterate(iterations: number) {
    for (let i = 0; i < iterations; i++) {
      const f = Math.floor(Math.random() * this.transforms.length)
      this.c = (this.c + this.colorCoords[f]) / 2;
      [this.x, this.y] = this.transforms[f].apply(this.x, this.y);

      this.palette.lookup(this.c, this.#scratchColor);
      this.histogram.plot(this.x, this.y, this.#scratchColor);
    }
  }
}
