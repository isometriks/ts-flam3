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

  static random() {
    const colors = [
      [1, 0.2, 0.2],
      [0.2, 1, 0.2],
      [0.2, 0.2, 1],
      [1, 1, 0],
    ];

    const [r, g, b] = colors[Math.round(Math.random() * (colors.length - 1))]

    return new this(r, g, b)
  }
}
