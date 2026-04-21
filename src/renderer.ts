import Histogram from "./histogram.ts";

export default class Renderer {
  histogram: Histogram;
  gamma: number = 4;
  brightness: number = 1;
  vibrancy: number = 1;

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

    const toneOpts = {
      gamma: this.gamma,
      brightness: this.brightness,
      vibrancy: this.vibrancy,
    };

    for (let y = 0; y < this.histogram.height; y++) {
      for (let x = 0; x < this.histogram.width; x++) {
        const bucket = this.histogram.get(x, y)
        const offset = (x + y * this.histogram.width) * 4

        const [r, g, b] = bucket.toRGB(this.histogram.max, toneOpts);

        pixels[offset] = r * 255
        pixels[offset + 1] = g * 255
        pixels[offset + 2] = b * 255
        pixels[offset + 3] = 255
      }
    }

    ctx.putImageData(id, 0, 0)
  }
}
