import Iterator from "./iterator.ts";
import Histogram from "./histogram.ts";
import Renderer from "./renderer.ts";
import KDE from "./kde.ts";

export default class Flame {
  histogram: Histogram
  iterator: Iterator

  constructor(width: number, height: number) {
    this.histogram = new Histogram(width, height)
    this.iterator = new Iterator(this.histogram)
  }

  iterate(iterations: number) {
    this.iterator.iterate(iterations)
  }

  render() {
    const finalHistogram = this.histogram.clone()
    const renderer = new Renderer(finalHistogram)
    const kde = new KDE(finalHistogram)

    for (let x = 0; x < finalHistogram.width; x++) {
      for (let y = 0; y < finalHistogram.height; y++) {
        const bucket = this.histogram.get(x, y)
        const radius = Math.min(3, 3 / bucket.r ** 0.6);

        if (false && radius > 1) {
          //bucket.reset()
          kde.spread(x, y, Math.ceil(radius), bucket)
        } else {
          finalHistogram.set(x, y, bucket.clone())
        }
      }
    }

    renderer.render();
  }
}
