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

  mix(bucket: Bucket, amount: number) {
    this.r += bucket.r * amount;
    this.g += bucket.g * amount;
    this.b += bucket.b * amount;
    this.a += bucket.a * amount;
  }

  toRGB(max?: number) {
    const logA = Math.log10((max ?? this.a) * 0.8);

    return [
      Math.log10(this.r) / logA,
      Math.log10(this.g) / logA,
      Math.log10(this.b) / logA,
      this.a
    ];
  }

  clone() {
    const cloned = new Bucket();

    Object.assign(cloned, {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a,
    })

    return cloned;
  }

  reset() {
    this.r = this.g = this.b = this.a = 0
  }
}
