import Transform from "../transform.ts";

type TransformMatrix = [
  [number, number, number],
  [number, number, number],
]

export default class AffineTransform implements Transform {
  // Identity matrix to start
  matrix: TransformMatrix = [
    [1, 0, 0],
    [0, 1, 0],
  ]

  constructor(matrix?: TransformMatrix) {
    if (matrix) {
      this.matrix = matrix;
    }
  }

  apply(x: number, y: number) {
    return [
      x * this.matrix[0][0] + y * this.matrix[0][1] + this.matrix[0][2],
      x * this.matrix[1][0] + y * this.matrix[1][1] + this.matrix[1][2],
    ] as [number, number]
  }

  rotate(radians: number) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const [[a, b, c], [d, e, f]] = this.matrix;
    this.matrix = [
      [a * cos - d * sin, b * cos - e * sin, c * cos - f * sin],
      [a * sin + d * cos, b * sin + e * cos, c * sin + f * cos],
    ];
  }

  static  rotation(radians: number): AffineTransform {
    return new this([
      [
        Math.cos(radians),
        -Math.sin(radians),
        0,
      ], [
        Math.sin(radians),
        Math.cos(radians),
        0
      ],
    ])
  }

  static random(): AffineTransform {
    return new this([
      [
        Math.random()*2 - 1,
        Math.random()*2 - 1,
        Math.random()*.5 - .25,
      ], [
        Math.random()*2 - 1,
        Math.random()*2 - 1,
        Math.random()*.5 - .25,
      ]
    ])
  }
}
