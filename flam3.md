# flam3 Design Notes

Project context for the TypeScript port of Scott Draves' "The Fractal Flame Algorithm"
(Draves & Reckase, 2003/2008; https://flam3.com/flame_draves.pdf). This file is the
working design doc — paper summary on top, codebase audit below.

## 1. Algorithm summary

### 1.1 IFS core

A flame is an iterated function system. State is a point `(x, y)` in the plane plus a
scalar color coordinate `c ∈ [0, 1]`. Each step:

1. Pick transform `i` with probability `w_i` (per-xform weight, normalized).
2. Apply `F_i`: affine pre-transform → weighted sum of variations → optional affine
   post-transform.
3. Update color: `c ← (c + c_i) / 2` where `c_i` is the xform's color coord.
4. Plot `(x, y, c)` into a histogram bucket.

The chaos game converges onto the attractor. The first ~20 iterations are *fused*
(discarded) so the starting point doesn't bias the image.

### 1.2 Transform structure

```
F_i(x, y) = post_i ∘ ( Σ_j  v_ij · V_j( pre_i(x, y) ) )
```

- `pre_i`, `post_i`: 6-parameter affine transforms `(a, b, c, d, e, f)`.
- `V_j`: one of 49 variations (sinusoidal, spherical, swirl, horseshoe, polar,
  handkerchief, heart, disc, spiral, hyperbolic, diamond, ex, julia, bent, waves,
  fisheye, popcorn, exponential, power, cosine, rings, fan, eyefish, bubble, cylinder,
  perspective, noise, julian, juliascope, blur, gaussian, radial blur, pie, ngon, curl,
  rectangles, arch, tangent, square, rays, blade, secant2, twintrian, cross, …).
- `v_ij`: variation weights (can be negative; typically sum to ~1).

Some variations are *dependent* on the affine coefficients (`julian`, `curl`, etc.),
so full fidelity requires passing the pre-transform coefficients into the variation.

### 1.3 Coloring

A palette of 256 RGB colors is sampled by `c`. The running color update
`c ← (c + c_i) / 2` gives smooth spatial color gradients. Per bucket we accumulate
`(R, G, B, α)` where `α` is the hit count (not opacity).

### 1.4 Tone mapping (the key visual trick)

Raw density is extreme (some pixels hit 10⁶× more than others). Flam3 uses a
**log-density** remap per bucket:

```
α_log     = log(1 + α) / α          # per-bucket scale factor
R_out     = (R / α) · α_log^(1/γ)   # channel normalized, then gamma
```

Equivalently, the paper expresses it as `α_scaled = log(α) / log(α_max)` then
`color_out = color_avg · α_scaled^(1/γ)`, with a small additive brightness term
before the log.

Parameters:

- `γ` (gamma) — typical default 4. Higher γ lifts dim areas.
- `brightness` — scales density before log.
- `vibrancy ∈ [0, 1]` — interpolates between per-channel gamma (`1`, more saturated)
  and grey-alpha gamma (`0`, closer to film response). Final:

  ```
  R_final = vibrancy · R/α · α_log^(1/γ)  +  (1 - vibrancy) · (R/α) · α_log^(1/γ_grey)
  ```

### 1.5 Supersampling & density estimation (KDE)

Render the histogram at `k×` the output resolution (k = 2 or 3), then downsample
with a filter. Plain Gaussian downsample works, but flam3's signature look comes
from **adaptive density estimation (DE)** during downsampling.

#### 1.5.1 Motivation

Flames are a Monte Carlo process — noise decreases as `1/√N` in sample count.
Sparsely sampled regions (flame edges, fine tendrils) are noisy; densely sampled
regions (the main body) are smooth. A fixed-width filter either over-smooths the
detail areas or under-smooths the sparse ones. DE sidesteps the tradeoff by
choosing a per-pixel kernel width that *shrinks as local sample count grows*.

The method is a simplification of **Suykens & Willems, "Adaptive Filtering for
Progressive Monte Carlo Image Rendering"** (WSCG 2000).

> Not all flame implementations include DE. Without it you get noisy edges
> (especially in long renders with lots of zero-hit buckets near fine detail).

#### 1.5.2 Per-bucket kernel width

From `flam3/filters.c:340-345`:

```
w(α) = R_max / (α + 1)^curve                          if α < 100
w(α) = R_max / ( (α − 100)^(1/curve) + 100 + 1 )^curve  otherwise
w(α) ← max(w(α), R_min)                               clamp
```

where:

- `α` = hit count for this supersampled bucket.
- `R_max = estimator_radius · ss + 1` (pixels in the supersampled buffer).
- `R_min = estimator_minimum · ss + 1`.
- `ss` = supersample factor (`spatial_oversample`).
- `curve` = `estimator_curve`.

The post-`keep_thresh=100` branch slows the decay for very high hit counts so the
kernel doesn't collapse below a sensible floor too quickly in the dense core.

#### 1.5.3 Kernel shape

**Gaussian**, computed via `flam3_spatial_filter(flam3_gaussian_kernel, ...)` at
`filters.c:365` and `:387`. An Epanechnikov alternative is present but commented
out. The kernel is circularly symmetric and radius-normalized (`de_filt_d =
dist/w`, zero outside `dist > w`), then area-normalized so coefficients sum to 1.

#### 1.5.4 Defaults (from `flam3.c`)

| Parameter            | Default | Meaning                                    |
|----------------------|--------:|--------------------------------------------|
| `estimator_radius`   | `9.0`   | Max kernel radius (output pixels)          |
| `estimator_minimum`  | `0.0`   | Min kernel radius (output pixels)          |
| `estimator_curve`    | `0.4`   | Decay exponent                             |

At `curve = 0.4`:

| Hit count α | `w(α) / R_max` |
|------------:|---------------:|
| 1           | 1.00           |
| 10          | ≈ 0.40         |
| 100         | ≈ 0.16         |
| 1000        | ≈ 0.06         |

So a 1-hit bucket smears over a `~9ss` radius; a 1000-hit bucket over ~0.5×.

#### 1.5.5 Kernel table

`flam3_create_de_filters` precomputes a table of kernels indexed by hit count.
The number of distinct kernels is:

```
num_filters = (R_max / R_min)^(1 / curve)
```

Each hit count selects a precomputed kernel; this is a plain array lookup at
render time — no per-pixel kernel generation.

#### 1.5.6 Interaction with supersampling

- Render into a supersampled histogram (size = output · ss in each dim).
- For each output pixel, pick the kernel sized by the hit count at that location
  in the supersampled buffer.
- Convolve that kernel with the supersampled `(R, G, B, α)` buffers, then apply
  tone mapping (§1.4) to the result.
- Filter radii are defined in *output* pixels but scaled by `ss` internally, so
  a `9.0` radius at `ss=3` covers ~28 supersampled pixels.

#### 1.5.7 Minimal pseudocode

```
for each output pixel (x, y):
    α_local = supersampled_α[x·ss, y·ss]                    # or averaged
    w       = clamp(R_max / (α_local + 1)^curve, R_min, R_max)
    kernel  = kernel_table[index_for(α_local)]              # Gaussian, radius w
    (R, G, B, α) = convolve(supersampled_buffer, kernel, at x·ss, y·ss)
    output[x, y]  = tone_map(R, G, B, α, gamma, brightness, vibrancy)
```

### 1.6 Final xform (F_final)

An optional post-iteration transform applied to `(x, y)` before plotting, but its
output is **not fed back** into the next iteration's state. It lets you warp the
entire attractor (e.g., spherical-invert the whole flame) without destabilizing the
IFS.

### 1.7 Symmetry

- **Rotational (n-fold)**: add `n − 1` rotation-only affine xforms.
- **Dihedral (reflection)**: add a mirror xform.

These are just extra identity-colored xforms appended to the xform list.

### 1.8 Other paper topics

- Motion blur / temporal supersampling for animations.
- 3D flames with depth-of-field.
- Genetic interpolation between flames (`flam3-genetic`).
- Electric Sheep: distributed rendering network.

## 2. Codebase audit

Current layout:

- `src/main.ts` — bootstraps, runs iterate/render on `setInterval`.
- `src/flame.ts` — wires histogram/iterator/renderer.
- `src/iterator.ts` — chaos-game loop; creates 3–6 random composite transforms.
- `src/histogram.ts` — 2D array of `Bucket`, world→pixel mapping.
- `src/bucket.ts` — accumulates `r, g, b, a` (a = hit count), log tone map.
- `src/color.ts` — `{r,g,b}` + `mix()` averaging.
- `src/renderer.ts` — reads bucket → ImageData → canvas.
- `src/variations/` — `affine`, `composite`, plus `bubble`, `handkerchief`,
  `horseshoe`, `polar`, `sinusoidal`, `spherical`, `spiral`, `swirl`.

### 2.1 Bugs (correctness)

1. **`variations/swirl.ts:9`** — paper V3 is `(x sin(r²) − y cos(r²), x cos(r²) + y sin(r²))`.
   Current code: `x*cos(r2) - Math.sin(r2)` (missing `y`, wrong sign on second term).
   The first component is also inverted in sign convention vs. the paper.
2. ~~**`bucket.ts:7`** — `a` starts at `255`.~~ **Fixed.** Now initialized to `0`.
3. ~~**`bucket.ts:17`** — log of raw color sum instead of density.~~ **Fixed.**
   `toRGB(max, γ = 2.2)` now computes `α_scaled = log(1+α)/log(1+α_max)`, then
   `(R/α, G/α, B/α) · α_scaled^(1/γ)`. Zero-hit buckets return black.
4. ~~**`iterator.ts:37`** — biased `Math.round` selection.~~ **Fixed.** Now
   uses `Math.floor(Math.random() * n)`. Per-xform weights `w_i` still TODO.
5. ~~**`iterator.ts:33-35`** — every-other-iteration rotation hack.~~ **Removed.**
6. ~~**`composite.ts:60`** — variation weights ~30× too small.~~ **Fixed.**
   Weights now drawn uniform in `[0, 1)` and normalized to sum to 1, so
   variations dominate the output instead of the affine pre-transform.
7. ~~**`iterator.ts:20`** — dark-start color accumulator.~~ **Fixed** as part of
   the palette refactor. Running color is now a scalar `c ∈ [0, 1]` initialized
   to `Math.random()`.

### 2.2 Missing pieces (fidelity)

- ~~**Palette-indexed color.**~~ **Done.** New `Palette` class (256-entry,
  linearly interpolated, generated from 3–5 random RGB waypoints). `Iterator`
  holds a scalar `c` and per-xform `c_i`; running update `c ← (c + c_i) / 2`;
  `palette.lookup(c, scratchColor)` fills a reused `Color` at plot time (no
  per-iteration allocation). `Color` is now just an RGB struct.
- **Fuse iterations.** Drop the first ~20 plots per burst so the starting point
  doesn't leave a bright dot.
- **Per-xform weights `w_i`.** Right now all xforms are equiprobable.
- **Post-transform** in `CompositeTransform` (the second affine after variations).
- **Final xform** applied before plotting but not to the state.
- ~~**Gamma, brightness, vibrancy** — renderer has none of these.~~ **Added.**
  `Renderer` now exposes `gamma` (default 4), `brightness` (default 1), and
  `vibrancy` (default 1) as public fields, threaded into `Bucket.toRGB`. Vibrancy
  interpolates between per-channel gamma (`v=0`, film-like) and density-only
  gamma (`v=1`, saturated).
- **Supersampling + filter.** Even a 2× oversample with a small Gaussian would
  dramatically improve quality.
- **Symmetry** as explicit xform injection (rotational/dihedral).

### 2.3 Performance

- Per-iteration `new Color(...)` in `Iterator.iterate` + `Color.mix` — two
  allocations per step. For ~10k iterations/frame it's fine; at 10⁶ it hurts. Use
  a scalar color coord `c` and mutate in place.
- `Histogram.buckets` is `Bucket[][]` with an object per pixel. For a 1400×650
  canvas that's ~900k objects. A flat `Float32Array` of length `w·h·4` (r,g,b,count)
  is much friendlier to the GC and the cache.
- Rendering every 120ms on the main thread blocks input. A `Worker` owning the
  histogram and posting typed-array snapshots would decouple iteration from UI.
- `renderer.ts` loops pixel-by-pixel with two `Math.log` calls per channel. Fine
  for now, but easy to vectorize once the histogram is a typed array.

### 2.4 Minor / cleanup

- `iterator.ts:4-7` imports `SphericalTransform`, `SwirlTransform`, `Color` that
  aren't used — only `CompositeTransform` and `AffineTransform` are.
- `spherical.ts:5` — `1/Math.sqrt(x**2 + y**2)**2` is correct (parses as
  `1/(sqrt(...)²) = 1/r²`), but `1 / (x*x + y*y)` is cheaper and clearer.
- `swirl.ts:5` — `Math.sqrt(...)**2` computes `r²` the long way; just `x*x + y*y`.
- `composite.ts` still exports `random()` that picks 1–4 variations without
  replacement — the paper allows (and often uses) a single variation per xform with
  weight 1, or multiple with weights summing to ~1. The "small random weights"
  makes everything look like a plain affine IFS.
- No type for `Palette` / `FlameGenome` — a single `FlameGenome` struct
  (xforms[], palette, camera, gamma, brightness, vibrancy, symmetry, finalXform)
  would make saving/loading/animating flames tractable.

## 3. Suggested roadmap

Rough priority order — cheap correctness fixes first, then fidelity, then polish.

1. Fix `swirl` formula; fix `bucket.a` initial value; fix uniform-selection bug in
   `iterator`.
2. Scale `CompositeTransform` variation weights to ~1.0 and optionally normalize so
   they sum to 1. This alone will produce dramatically more varied output.
3. Replace RGB color averaging with a scalar `c ∈ [0,1]` + 256-entry palette.
4. Introduce a `FlameGenome` type and separate "genome" from "renderer state."
5. Add fuse iterations, per-xform weights, post-transform, final xform.
6. Rewrite histogram as a flat `Float32Array`; move iteration into a Worker.
7. Proper tone mapping in renderer: log-density, gamma, vibrancy, brightness.
8. ~~Add supersampling + downsample.~~ **Done.** `Flame(w, h, ss = 2)` sizes the
   histogram at `ss·w × ss·h`; the iterator plots into it unchanged; `Renderer`
   box-filter-downsamples the raw `(R, G, B, count)` sums per `ss×ss` block,
   tracks the aggregated max for tone mapping, then tone-maps to canvas.
   `toneMap` extracted from `Bucket` as a reusable function.
9. ~~Add density estimation (§1.5).~~ **Done.** Gather-style, opt-in via
   `renderer.densityEstimation = true` (default off — slow). Exposes
   `estimatorRadius` (9), `estimatorMinimum` (0), `estimatorCurve` (0.4). Per
   output pixel: sum α across ss×ss, pick a cached Gaussian kernel of radius
   `R_max / (α+1)^curve` clamped to `[R_min, R_max]`, gather weighted sum from
   the supersampled histogram. Kernels are pre-normalized and cached by α tier
   (capped at 1024); cache invalidates when DE params change.
9. Symmetry injection (rotational + dihedral) as xform-list transforms.
10. Expand variation library toward the paper's 49; add dependent variations
    (needs variation API extension to receive affine coefficients).

## 4. Useful references

- Paper: https://flam3.com/flame_draves.pdf
- Reference C implementation: https://github.com/scottdraves/flam3
- DE filter source (authoritative for §1.5):
  https://github.com/scottdraves/flam3/blob/master/filters.c — `flam3_create_de_filters`
- DE parameter defaults: `flam3.c` — `cp->estimator = 9.0`, `estimator_minimum =
  0.0`, `estimator_curve = 0.4`.
- Wikipedia summary: https://en.wikipedia.org/wiki/Fractal_flame#Density_estimation
- Suykens & Willems, *Adaptive Filtering for Progressive Monte Carlo Image
  Rendering*, WSCG 2000 (paper DE is a simplification of).
- Variation catalog with formulas: https://www.flam3.com/flame_variations.pdf
  (and community extensions via Apophysis / JWildfire plugin lists).
