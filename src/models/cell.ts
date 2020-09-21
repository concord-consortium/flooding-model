export interface CellOptions {
  id?: number;
  x: number;
  y: number;
  isEdge?: boolean;
  isRiver?: boolean;
  baseElevation?: number;
  waterDepth?: number;
  permeability?: number;
}

export interface ICellSnapshot {
  waterDepth: number;
  waterSaturation: number;
  fluxL: number;
  fluxR: number;
  fluxT: number;
  fluxB: number;
  leveeHeight: number;
}

export class Cell {
  // Base state (each time it's updated, simulation.cellsBaseStateFlag should be updated!):
  public leveeHeight = 0;
  public baseElevation = 0;
  // ---
  // Simulation state (each time it's updated, simulation.cellsSimulationStateFlag should be updated!):
  public waterDepth = 0;
  // ---
  public id: number; // unique id
  public x: number; // grid X coord
  public y: number; // grid Y coord
  public isEdge = false;
  public isRiver = false;
  public isRiverBank = false;
  public riverBankSegmentIdx: number;
  public permeability = 0;
  public waterSaturation = 0;
  public initialWaterSaturation = 0;
  public initialWaterDepth = 0;
  public fluxL = 0; // left
  public fluxR = 0; // right
  public fluxT = 0; // top
  public fluxB = 0; // bottom

  constructor(props: CellOptions) {
    Object.assign(this, props);
    this.initialWaterDepth = props.waterDepth || 0;
  }

  public get elevation() {
    return this.baseElevation + this.waterDepth + this.leveeHeight;
  }

  public get fluxOut() {
    return this.fluxL + this.fluxR + this.fluxB + this.fluxT;
  }

  public get isLevee() {
    return this.leveeHeight > 0;
  }

  public reset() {
    this.waterDepth = this.initialWaterDepth;
    this.waterSaturation = this.initialWaterSaturation;
    this.fluxL = 0;
    this.fluxR = 0;
    this.fluxT = 0;
    this.fluxB = 0;
  }

  public snapshot(): ICellSnapshot {
    return {
      waterDepth: this.waterDepth,
      waterSaturation: this.waterSaturation,
      fluxL: this.fluxL,
      fluxR: this.fluxR,
      fluxT: this.fluxT,
      fluxB: this.fluxB,
      leveeHeight: this.leveeHeight
    };
  }

  public restoreSnapshot(snapshot: ICellSnapshot) {
    Object.assign(this, snapshot);
  }
}
