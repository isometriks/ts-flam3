import Bucket from "./bucket.ts";
import Color from "./color.ts";

export default class Histogram {
  width: number
  height: number
  buckets: Bucket[][]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.buckets = []

    for (let y = 0; y < height; y++) {
      this.buckets[y] = []

      for (let x = 0; x < width; x++) {
        this.buckets[y][x] = new Bucket()
      }
    }
  }

  plot(x: number, y: number, color: Color) {
    const factor = Math.min(this.width, this.height)
    const px = Math.round(x * factor + this.width/2)
    const py = Math.round(y * factor + this.height/2)

    if (px < 0 || py < 0 || px >= this.width || py >= this.height || isNaN(px) || isNaN(py)) {
      return;
    }

    this.get(px, py).add(color);
  }

  get(x: number, y: number) {
    return this.buckets[y][x];
  }
}
