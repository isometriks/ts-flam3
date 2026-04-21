import Iterator from "./iterator.ts";
import Histogram from "./histogram.ts";
import Renderer from "./renderer.ts";

export default class Flame {
  histogram: Histogram
  iterator: Iterator
  renderer: Renderer
  outputWidth: number
  outputHeight: number
  supersample: number

  constructor(width: number, height: number, supersample: number = 2) {
    this.outputWidth = width
    this.outputHeight = height
    this.supersample = supersample
    this.histogram = new Histogram(width * supersample, height * supersample)
    this.iterator = new Iterator(this.histogram)
    this.renderer = new Renderer(this.histogram, width, height, supersample)
  }

  iterate(iterations: number) {
    this.iterator.iterate(iterations)
  }

  render() {
    this.renderer.render()
  }
}
