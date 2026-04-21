import Color from "./color.ts";

export default class Bucket {
  r: number = 0;
  g: number = 0;
  b: number = 0;
  a: number = 0;

  add(color: Color) {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;
    this.a += 1;
  }

  toRGB(max: number, gamma: number = 2.2) {
    if (this.a === 0 || max <= 0) {
      return [0, 0, 0, 0];
    }

    // Log-density tone map: α_scaled = log(1 + α) / log(1 + α_max) in [0, 1].
    // Then normalize accumulated color by hit count and weight by α_scaled^(1/γ).
    const density = Math.log(1 + this.a) / Math.log(1 + max);
    const scale = Math.pow(density, 1 / gamma);

    return [
      (this.r / this.a) * scale,
      (this.g / this.a) * scale,
      (this.b / this.a) * scale,
      this.a,
    ];
  }
}
