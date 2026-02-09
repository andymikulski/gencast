export interface IShape {
  getArea(): number;
  getName(): string;
}

export class Circle implements IShape {
  private radius = 10;

  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }
  getName(): string {
    return "Circle";
  }
}
