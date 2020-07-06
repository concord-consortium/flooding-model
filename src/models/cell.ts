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
  public initialWaterDepth = 0;
  public waterDepth = 0;
  public fluxL = 0; // left
  public fluxR = 0; // right
  public fluxT = 0; // top
  public fluxB = 0; // bottom

  constructor(props: CellOptions, riverDepth: number) {
    Object.assign(this, props);
    if (props.isRiver && !props.isEdge) {
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

  public get fluxOut() {
    return this.fluxL + this.fluxR + this.fluxB + this.fluxT;
  }

  public reset() {
    this.waterDepth = this.initialWaterDepth;
    this.fluxL = 0;
    this.fluxR = 0;
    this.fluxT = 0;
    this.fluxB = 0;
  }
}
