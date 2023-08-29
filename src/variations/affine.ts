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

  static rotation(radians: number): AffineTransform {
    return new this([
      [
        Math.cos(radians / 4),
        -Math.sin(radians / 4),
        0,
      ], [
        Math.sin(radians / 4),
        Math.cos(radians / 4),
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
