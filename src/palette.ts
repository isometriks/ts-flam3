import Color from "./color.ts";

// A 1-D palette of RGB triples indexed by a scalar c ∈ [0, 1]. The paper's
// coloring model: each xform carries a scalar color coordinate c_i; the
// running state is c ← (c + c_i) / 2; at plot time the bucket receives
// palette.lookup(c) rather than a raw RGB mix. Smooth gradients come for
// free because repeated scalar averaging stays near the palette, instead of
// collapsing to mid-grey the way RGB averaging does.
export default class Palette {
  size: number;
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;

  constructor(r: Float32Array, g: Float32Array, b: Float32Array) {
    this.size = r.length;
    this.r = r;
    this.g = g;
    this.b = b;
  }

  // Fills `out` with the linearly interpolated palette entry at c.
  lookup(c: number, out: Color): void {
    if (c < 0) c = 0; else if (c > 1) c = 1;
    const idx = c * (this.size - 1);
    const i0 = Math.floor(idx);
    const i1 = i0 + 1 < this.size ? i0 + 1 : i0;
    const t = idx - i0;
    const u = 1 - t;
    out.r = this.r[i0] * u + this.r[i1] * t;
    out.g = this.g[i0] * u + this.g[i1] * t;
    out.b = this.b[i0] * u + this.b[i1] * t;
  }

  // Builds a smooth palette from 3–5 random RGB waypoints, linearly
  // interpolated across `size` entries.
  static random(size: number = 256): Palette {
    const numStops = 3 + Math.floor(Math.random() * 3);
    const stopR: number[] = [];
    const stopG: number[] = [];
    const stopB: number[] = [];
    for (let i = 0; i < numStops; i++) {
      stopR.push(Math.random());
      stopG.push(Math.random());
      stopB.push(Math.random());
    }

    const r = new Float32Array(size);
    const g = new Float32Array(size);
    const b = new Float32Array(size);

    for (let i = 0; i < size; i++) {
      const t = (i / (size - 1)) * (numStops - 1);
      const i0 = Math.floor(t);
      const i1 = i0 + 1 < numStops ? i0 + 1 : i0;
      const frac = t - i0;
      const u = 1 - frac;
      r[i] = stopR[i0] * u + stopR[i1] * frac;
      g[i] = stopG[i0] * u + stopG[i1] * frac;
      b[i] = stopB[i0] * u + stopB[i1] * frac;
    }

    return new Palette(r, g, b);
  }
}
