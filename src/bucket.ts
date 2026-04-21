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

  toRGB(
    max: number,
    opts: { gamma?: number; brightness?: number; vibrancy?: number } = {},
  ) {
    if (this.a === 0 || max <= 0) {
      return [0, 0, 0, 0];
    }

    const gamma = opts.gamma ?? 4;
    const brightness = opts.brightness ?? 1;
    const vibrancy = opts.vibrancy ?? 1;
    const invGamma = 1 / gamma;

    // Log-density scaling: α_scaled ∈ [0, 1]. Brightness lifts the log curve
    // before normalization so dim buckets contribute more.
    const alphaScaled =
      Math.log(1 + brightness * this.a) / Math.log(1 + brightness * max);
    const densityGamma = Math.pow(alphaScaled, invGamma);

    // Vibrancy interpolates between two gamma placements:
    // - vibrancy=1: gamma on density only, preserves color ratios (saturated).
    // - vibrancy=0: gamma on the whole channel value, desaturates (film-like).
    const toneMap = (sum: number) => {
      const c = sum / this.a;
      return (
        vibrancy * c * densityGamma +
        (1 - vibrancy) * Math.pow(c * alphaScaled, invGamma)
      );
    };

    return [toneMap(this.r), toneMap(this.g), toneMap(this.b), this.a];
  }
}
