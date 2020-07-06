export interface CellOptions {
  x: number;
  y: number;
  isEdge?: boolean;
  isRiver?: boolean;
  baseElevation?: number;
  waterDepth?: number;
}

export class Cell {
  public x: number; // grid X coord
  public y: number; // grid Y coord
  public isEdge = false;
  public isRiver = false;
  public baseElevation = 0;
  public waterDepth = 0;
  public initialWaterDepth = 0;
  public velocity = 0;

  constructor(props: CellOptions, riverDepth: number) {
    Object.assign(this, props);
    if (props.isRiver) {
      this.waterDepth = riverDepth;
      this.initialWaterDepth = riverDepth;
    }
  }

  public get elevation() {
    return this.baseElevation + this.waterDepth;
  }

  public get isWater() {
    return this.waterDepth > 0;
  }

  public reset() {
    this.waterDepth = this.initialWaterDepth;
    this.velocity = 0;
  }
}
