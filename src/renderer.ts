import Histogram from "./histogram.ts";

export default class Renderer {
  histogram: Histogram;

  constructor(histogram: Histogram) {
    this.histogram = histogram;
  }

  render() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.width = this.histogram.width
    canvas.height = this.histogram.height

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const id = ctx.getImageData(0, 0, this.histogram.width, this.histogram.height)
    const pixels = id.data

    for (let y = 0; y < this.histogram.height; y++) {
      for (let x = 0; x < this.histogram.width; x++) {
        const bucket = this.histogram.get(x, y)
        const offset = (x + y * this.histogram.width) * 4

        //const color = new Color("sRGB", bucket.toRGB())
        //color.lch.c *= 1.4;
        const [r, g, b] = bucket.toRGB(this.histogram.max);
        const color = { r, g, b }

        pixels[offset] = color.r * 255
        pixels[offset + 1] = color.g * 255
        pixels[offset + 2] = color.b * 255
        pixels[offset + 3] = 255 //a * 255
      }
    }

    ctx.putImageData(id, 0, 0)
  }
}
