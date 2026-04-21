import Color from "./color.ts";

export interface ToneMapOpts {
  gamma?: number;
  brightness?: number;
  vibrancy?: number;
}

// Log-density tone map. Works on any (R, G, B, count) triple plus a reference
// max, so it can be reused by the raw per-bucket path and by the supersampled
// downsample path in Renderer. See flam3.md §1.4.
export function toneMap(
  r: number,
  g: number,
  b: number,
  count: number,
  max: number,
  opts: ToneMapOpts = {},
): [number, number, number, number] {
  if (count === 0 || max <= 0) return [0, 0, 0, 0];

  const gamma = opts.gamma ?? 4;
  const brightness = opts.brightness ?? 1;
  const vibrancy = opts.vibrancy ?? 1;
  const invGamma = 1 / gamma;

  const alphaScaled =
    Math.log(1 + brightness * count) / Math.log(1 + brightness * max);
  const densityGamma = Math.pow(alphaScaled, invGamma);

  const map = (sum: number) => {
    const c = sum / count;
    return (
      vibrancy * c * densityGamma +
      (1 - vibrancy) * Math.pow(c * alphaScaled, invGamma)
    );
  };

  return [map(r), map(g), map(b), count];
}

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

  toRGB(max: number, opts: ToneMapOpts = {}) {
    return toneMap(this.r, this.g, this.b, this.a, max, opts);
  }
}
