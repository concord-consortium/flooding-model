export interface CellOptions {
  x: number;
  y: number;
  baseElevation?: number;
  isRiver?: boolean;
  isEdge?: boolean;
}

export class Cell {
  public x: number; // grid X coord
  public y: number; // grid Y coord
  public baseElevation = 0;
  public isRiver = false;
  public isFlooded = false;
  public isEdge = false;
  public isWaterEdge = false;

  constructor(props: CellOptions) {
    Object.assign(this, props);
  }

  public get elevation() {
    return this.baseElevation;
  }

  public get isWater() {
    return this.isRiver || this.isFlooded;
  }

  public reset() {
    this.isFlooded = false;
  }
}
