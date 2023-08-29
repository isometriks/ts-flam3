import Color from "./color.ts";

export default class Bucket {
  r: number = 0;
  g: number = 0;
  b: number = 0;
  a: number = 255;

  add(color: Color) {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;
    this.a += 1;
  }

  toRGB() {
    const logA = Math.log(this.a);

    return [
      Math.log(this.r) / logA,
      Math.log(this.g) / logA,
      Math.log(this.b) / logA,
      this.a
    ];
  }
}
