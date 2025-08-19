import Color from "./color.ts";

export default class Bucket {
  r: number = 0;
  g: number = 0;
  b: number = 0;
  a: number = 255;

  add(color: Color, weight: number = 1) {
    this.r += color.r * weight;
    this.g += color.g * weight;
    this.b += color.b * weight;
    this.a += weight;
  }

  toRGB(max?: number) {
    const logA = Math.log((max ?? this.a) * 0.8);

    return [
      Math.log(this.r) / logA,
      Math.log(this.g) / logA,
      Math.log(this.b) / logA,
      this.a
    ];
  }
}
