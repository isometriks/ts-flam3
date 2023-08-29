import Iterator from "./iterator.ts";
import Histogram from "./histogram.ts";
import Renderer from "./renderer.ts";

export default class Flame {
  histogram: Histogram
  iterator: Iterator
  renderer: Renderer

  constructor(width: number, height: number) {
    this.histogram = new Histogram(width, height)
    this.iterator = new Iterator(this.histogram)
    this.renderer = new Renderer(this.histogram)
  }

  iterate(iterations: number) {
    this.iterator.iterate(iterations)
  }

  render() {
    this.renderer.render()
  }
}
