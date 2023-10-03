import Histogram from "./histogram.ts";
import Bucket from "./bucket.ts";

export default class KDE {
  constructor(
    private histogram: Histogram
  ) {}

  /**
   * Uses a Gaussian blur to spread lower density areas
   */
  spread(x: number, y: number, width: number, bucket: Bucket) {
    const a = (1 / (width * Math.sqrt(2 * Math.PI)))

    for (const [cell, distance] of this.#cells(x, y, width)) {
      const area = a * Math.exp(-(distance ** 2) / (2 * width ** 2))
      cell.mix(bucket, area);
    }
  }

  *#cells(x: number, y: number, width: number): Generator<[Bucket, number]> {
    for (let ix = x - width; ix < x + width; ix++) {
      for (let iy = y - width; iy < y + width; iy++) {
        if (ix < 0 || iy < 0 || ix >= this.histogram.width || iy >= this.histogram.height) {
          continue;
        }

        const distance = Math.sqrt((ix - x) ** 2 + (iy - y) ** 2)

        if (distance > width) {
          continue;
        }

        yield [this.histogram.get(ix, iy), distance];
      }
    }
  }
}
