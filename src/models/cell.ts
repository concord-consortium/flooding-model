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
  public baseElevation: number = 0;
  public isRiver: boolean = false;
  public isFlooded: boolean = false;
  public isEdge: boolean = false;
  public isWaterEdge: boolean = false;

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
