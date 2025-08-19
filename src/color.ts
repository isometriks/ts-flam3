// Curated color handling and palette for fractal flame rendering
export default class Color {
  r: number
  g: number
  b: number

  constructor(r: number = 0, g: number = 0, b: number = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  mix(color: Color) {
    return new Color(
      (this.r + color.r) / 2,
      (this.g + color.g) / 2,
      (this.b + color.b) / 2,
    )
  }

  // A curated palette of visually pleasing colors in sRGB (0..1)
  // Balanced around the hue circle, moderate to high saturation, mid lightness.
  private static readonly PALETTE: [number, number, number][] = [
    // Reds / Oranges
    Color.hex("#e63946"), // coral red
    Color.hex("#ff6b6b"), // soft red
    Color.hex("#ff9f1c"), // vivid orange
    Color.hex("#f77f00"), // deep orange
    // Yellows / Limes
    Color.hex("#ffd166"), // warm yellow
    Color.hex("#ffe66d"), // sunflower
    Color.hex("#a7c957"), // lime green
    Color.hex("#70e000"), // vivid lime
    // Greens / Teals
    Color.hex("#2a9d8f"), // teal green
    Color.hex("#06d6a0"), // mint green
    Color.hex("#00b894"), // emerald
    Color.hex("#10b981"), // jade
    // Cyans / Aquas
    Color.hex("#00c2ff"), // sky cyan
    Color.hex("#64dfdf"), // aqua
    Color.hex("#56cfe1"), // light teal
    // Blues
    Color.hex("#118ab2"), // cyan-blue
    Color.hex("#1d4ed8"), // royal blue
    Color.hex("#3a86ff"), // vivid blue
    Color.hex("#4361ee"), // indigo blue
    // Purples / Violets
    Color.hex("#6a4c93"), // royal purple
    Color.hex("#9b5de5"), // violet
    Color.hex("#8b5cf6"), // lavender indigo
    Color.hex("#7c3aed"), // deep purple
    // Magentas / Pinks
    Color.hex("#c9184a"), // crimson pink
    Color.hex("#ff006e"), // hot magenta
    Color.hex("#f72585"), // neon pink
    Color.hex("#ff85a1"), // soft pink
    // Gold / Amber accents
    Color.hex("#f59e0b"),
    Color.hex("#fbbf24"),
  ];

  // Convert hex to normalized sRGB triple
  private static hex(hex: string): [number, number, number] {
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2), 16)/255;
    const g = parseInt(h.substring(2,4), 16)/255;
    const b = parseInt(h.substring(4,6), 16)/255;
    return [r, g, b];
  }

  // Return a random color from the curated palette with slight jitter for variety
  static random() {
    const idx = Math.floor(Math.random() * Color.PALETTE.length);
    const base = Color.PALETTE[idx];
    // Small jitter to avoid flat uniform areas (kept subtle to preserve palette)
    const jitter = 0.03; // ~3% in linear sRGB
    const j = () => (Math.random() * 2 - 1) * jitter;
    const r = Math.min(1, Math.max(0, base[0] + j()));
    const g = Math.min(1, Math.max(0, base[1] + j()));
    const b = Math.min(1, Math.max(0, base[2] + j()));
    return new this(r, g, b);
  }
}
