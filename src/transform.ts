export default interface Transform {
  apply(x: number, y: number): [number, number]
}
