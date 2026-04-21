import Histogram from "./histogram.ts";
import { toneMap } from "./bucket.ts";

interface Kernel {
  size: number;        // full diameter in supersampled pixels (odd)
  halfSize: number;    // (size - 1) / 2
  coefs: Float32Array; // row-major, pre-normalized to sum to 1
}

export default class Renderer {
  histogram: Histogram;
  outputWidth: number;
  outputHeight: number;
  supersample: number;

  // Tone mapping
  gamma: number = 1.2;
  brightness: number = 1;
  vibrancy: number = 1;

  // Density estimation (§1.5). Off by default — each full pass is O(w²) per
  // output pixel and takes hundreds of ms to several seconds at defaults.
  densityEstimation: boolean = false;
  estimatorRadius: number = 9;    // R_max in output pixels
  estimatorMinimum: number = 0;   // R_min in output pixels
  estimatorCurve: number = 0.4;

  #outR: Float32Array;
  #outG: Float32Array;
  #outB: Float32Array;
  #outA: Float32Array;

  // Kernels cached by α tier. Invalidated when DE params change.
  #kernelCache: Map<number, Kernel> = new Map();
  #cachedParamsKey: string = "";

  constructor(
    histogram: Histogram,
    outputWidth: number,
    outputHeight: number,
    supersample: number = 1,
  ) {
    this.histogram = histogram;
    this.outputWidth = outputWidth;
    this.outputHeight = outputHeight;
    this.supersample = supersample;

    const outLen = outputWidth * outputHeight;
    this.#outR = new Float32Array(outLen);
    this.#outG = new Float32Array(outLen);
    this.#outB = new Float32Array(outLen);
    this.#outA = new Float32Array(outLen);
  }

  render() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = this.outputWidth;
    canvas.height = this.outputHeight;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const id = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const pixels = id.data;

    const outMax = this.densityEstimation
      ? this.#densityEstimatePass()
      : this.#boxFilterPass();

    const toneOpts = {
      gamma: this.gamma,
      brightness: this.brightness,
      vibrancy: this.vibrancy,
    };

    const len = this.outputWidth * this.outputHeight;
    const outR = this.#outR;
    const outG = this.#outG;
    const outB = this.#outB;
    const outA = this.#outA;

    for (let i = 0; i < len; i++) {
      const [r, g, b] = toneMap(outR[i], outG[i], outB[i], outA[i], outMax, toneOpts);
      const offset = i * 4;
      pixels[offset] = r * 255;
      pixels[offset + 1] = g * 255;
      pixels[offset + 2] = b * 255;
      pixels[offset + 3] = 255;
    }

    ctx.putImageData(id, 0, 0);
  }

  // Box-filter downsample: sum raw (R, G, B, count) across each ss×ss block.
  #boxFilterPass(): number {
    const ss = this.supersample;
    const outW = this.outputWidth;
    const outH = this.outputHeight;
    const outR = this.#outR;
    const outG = this.#outG;
    const outB = this.#outB;
    const outA = this.#outA;
    let outMax = 0;

    for (let oy = 0; oy < outH; oy++) {
      const sy0 = oy * ss;
      for (let ox = 0; ox < outW; ox++) {
        const sx0 = ox * ss;
        let r = 0, g = 0, b = 0, a = 0;
        for (let dy = 0; dy < ss; dy++) {
          for (let dx = 0; dx < ss; dx++) {
            const bucket = this.histogram.get(sx0 + dx, sy0 + dy);
            r += bucket.r;
            g += bucket.g;
            b += bucket.b;
            a += bucket.a;
          }
        }
        const idx = oy * outW + ox;
        outR[idx] = r;
        outG[idx] = g;
        outB[idx] = b;
        outA[idx] = a;
        if (a > outMax) outMax = a;
      }
    }

    return outMax;
  }

  // Adaptive-kernel gather: per output pixel, pick a Gaussian whose radius
  // shrinks as local α grows, then weight-sum from the supersampled buffer.
  // Pre-normalized kernels produce density *averages*, not integrals — tone
  // mapping compensates via the tracked max.
  #densityEstimatePass(): number {
    const ss = this.supersample;
    const outW = this.outputWidth;
    const outH = this.outputHeight;
    const outR = this.#outR;
    const outG = this.#outG;
    const outB = this.#outB;
    const outA = this.#outA;
    const hist = this.histogram;
    const histW = hist.width;
    const histH = hist.height;

    // R_max and R_min are expressed in output pixels in the public API; flam3
    // internally scales to supersampled pixels (+1 for first-pixel offset).
    const rMax = this.estimatorRadius * ss + 1;
    const rMin = Math.max(this.estimatorMinimum * ss + 1, 1);
    const curve = this.estimatorCurve;

    this.#invalidateKernelCacheIfNeeded();

    let outMax = 0;

    for (let oy = 0; oy < outH; oy++) {
      const sy0 = oy * ss;
      for (let ox = 0; ox < outW; ox++) {
        const sx0 = ox * ss;

        // Sum α across the ss×ss block — more stable than a single-bucket
        // reading when choosing the kernel.
        let alpha = 0;
        for (let dy = 0; dy < ss; dy++) {
          for (let dx = 0; dx < ss; dx++) {
            alpha += hist.get(sx0 + dx, sy0 + dy).a;
          }
        }

        const kernel = this.#getKernel(alpha, rMax, rMin, curve);
        const halfSize = kernel.halfSize;
        const coefs = kernel.coefs;
        const size = kernel.size;

        // Center the kernel on the ss×ss block center.
        const scx = sx0 + (ss >> 1);
        const scy = sy0 + (ss >> 1);

        let r = 0, g = 0, b = 0, count = 0;
        for (let ky = -halfSize; ky <= halfSize; ky++) {
          const sy = scy + ky;
          if (sy < 0 || sy >= histH) continue;
          const rowOffset = (ky + halfSize) * size;
          for (let kx = -halfSize; kx <= halfSize; kx++) {
            const sx = scx + kx;
            if (sx < 0 || sx >= histW) continue;
            const coef = coefs[rowOffset + kx + halfSize];
            if (coef === 0) continue;
            const bucket = hist.get(sx, sy);
            r += bucket.r * coef;
            g += bucket.g * coef;
            b += bucket.b * coef;
            count += bucket.a * coef;
          }
        }

        const idx = oy * outW + ox;
        outR[idx] = r;
        outG[idx] = g;
        outB[idx] = b;
        outA[idx] = count;
        if (count > outMax) outMax = count;
      }
    }

    return outMax;
  }

  #invalidateKernelCacheIfNeeded() {
    const key = `${this.supersample}|${this.estimatorRadius}|${this.estimatorMinimum}|${this.estimatorCurve}`;
    if (key !== this.#cachedParamsKey) {
      this.#kernelCache.clear();
      this.#cachedParamsKey = key;
    }
  }

  #getKernel(alpha: number, rMax: number, rMin: number, curve: number): Kernel {
    // Cap the cache key — kernels below rMin are all identical, so many
    // high-α tiers collapse to the same kernel.
    const tier = alpha > 1024 ? 1024 : alpha;
    const cached = this.#kernelCache.get(tier);
    if (cached) return cached;

    let w = rMax / Math.pow(tier + 1, curve);
    if (w < rMin) w = rMin;
    if (w > rMax) w = rMax;

    // Gaussian with σ = w/2 truncated at radius w, integer-sampled, normalized.
    const halfSize = Math.max(1, Math.ceil(w));
    const size = halfSize * 2 + 1;
    const coefs = new Float32Array(size * size);
    const sigma = Math.max(w / 2, 0.5);
    const twoSigma2 = 2 * sigma * sigma;
    const w2 = w * w;
    let sum = 0;

    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const r2 = dx * dx + dy * dy;
        if (r2 > w2) continue;
        const v = Math.exp(-r2 / twoSigma2);
        coefs[(dy + halfSize) * size + (dx + halfSize)] = v;
        sum += v;
      }
    }

    if (sum > 0) {
      const inv = 1 / sum;
      for (let i = 0; i < coefs.length; i++) coefs[i] *= inv;
    }

    const kernel: Kernel = { size, halfSize, coefs };
    this.#kernelCache.set(tier, kernel);
    return kernel;
  }
}
