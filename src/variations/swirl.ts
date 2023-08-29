import Transform from "../transform.ts";

export default class SwirlTransform implements Transform {
  apply(x: number, y: number): [number, number] {
    const r2 = Math.sqrt(x**2 + y**2)**2

    return [
      x*Math.sin(r2) - y*Math.cos(r2),
      x*Math.cos(r2) - Math.sin(r2)
    ]
  }
}
