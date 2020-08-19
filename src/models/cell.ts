export interface CellOptions {
  x: number;
  y: number;
  isEdge?: boolean;
  isRiver?: boolean;
  baseElevation?: number;
  waterDepth?: number;
  permeability?: number;
}

export class Cell {
  public x: number; // grid X coord
  public y: number; // grid Y coord
  public isEdge = false;
  public isRiver = false;
  public baseElevation = 0;
  public permeability = 0;
  public riverStage = 0;
  public waterDepth = 0;
  public initialWaterDepth = 0;
  public initialRiverStage = 0;
  public fluxL = 0; // left
  public fluxR = 0; // right
  public fluxT = 0; // top
  public fluxB = 0; // bottom

  constructor(props: CellOptions) {
    Object.assign(this, props);
    this.initialWaterDepth = props.waterDepth || 0;
  }

  public get elevation() {
    return this.baseElevation + this.waterDepth;
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
