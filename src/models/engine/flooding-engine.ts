// Lightweight helper that is responsible only for math calculations. It's not bound to MobX or any UI state
// (it's role of the Simulation model). Config properties are explicitly listed, so it's clear
// which config options are responsible for simulation progress.
//
// Model partially based on:
// Xing Mei, Philippe Decaudin, Bao-Gang Hu. Fast Hydraulic Erosion Simulation and Visualization
// on GPU. PG ’07 - 15th Pacific Conference on Computer Graphics and Applications, Oct 2007, Maui,
// United States. pp.47-56, ff10.1109/PG.2007.15ff. ffinria-00402079
//
// Example implementation (although GPU-based): https://github.com/skeelogy/skunami.js
import { Cell } from "../cell";
import { getGridIndexForLocation } from "../utils/grid-utils";

export interface IFireEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

const GRAVITY = 9.81;
// DAMPING_FACTOR will reduce bouncing of waves.
const DAMPING_FACTOR = 0.95;
// PIPE_FACTOR can help with instabilities. Might need to be adjusted for different grid sizes and timesteps.
const PIPE_FACTOR = 0.5;

const getNewFlux = (dt: number, oldFlux: number, heightDiff: number, cellSize: number) => {
  // Original equation: oldFlux + dt * pipeArea * GRAVITY * heightDiff / pipeLength;
  // It can be simplified if cross-sectional area of the pipe and pipe length is included in PIPE_FACTOR constant.
  let newFlux = oldFlux + PIPE_FACTOR * cellSize * dt * GRAVITY * heightDiff;
  newFlux = Math.max(0, newFlux);

  return newFlux * DAMPING_FACTOR;
};

export class FloodingEngine {
  public cells: Cell[];
  public gridWidth: number;
  public gridHeight: number;
  public cellSize: number;
  public simulationDidStop = false;
  public waterSum = 0;
  public waterIncrement = 0;
  public waterDecrement = 0;

  constructor(cells: Cell[], config: IFireEngineConfig) {
    this.cells = cells;
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
  }

  public update(dt: number) {
    this.addWaterInRiver(dt);
    this.updateFlux(dt);
    this.updateWaterDepth(dt);
    this.removeWater(dt);
  }

  public addWaterInRiver(dt: number) {
    this.cells.forEach(cell => {
      if (!cell.isRiver || cell.isEdge) {
        return;
      }
      cell.waterDepth += this.waterIncrement * dt;
    });
  }

  public removeWater(dt: number) {
    this.cells.forEach(cell => {
      if (cell.isEdge || cell.waterDepth === 0) {
        return;
      }
      cell.waterDepth -= this.waterDecrement * dt;
      cell.waterDepth = Math.max(0, cell.waterDepth);
    });
  }

  public updateFlux(dt: number) {
    let nFluxL: number, nFluxR: number, nFluxB: number, nFluxT: number;
    const cellArea = this.cellSize * this.cellSize;

    this.cells.forEach(cell => {
      if (cell.isEdge) {
        return;
      }

      const x = cell.x;
      const y = cell.y;
      let nCell;

      // fluxL
      nCell = this.cells[getGridIndexForLocation(x - 1, y, this.gridWidth)];
      nFluxL = !nCell.isEdge ? getNewFlux(dt, cell.fluxL, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxR
      nCell = this.cells[getGridIndexForLocation(x + 1, y, this.gridWidth)];
      nFluxR = !nCell.isEdge ? getNewFlux(dt, cell.fluxR, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxB
      nCell = this.cells[getGridIndexForLocation(x, y - 1, this.gridWidth)];
      nFluxB = !nCell.isEdge ? getNewFlux(dt, cell.fluxB, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxT
      nCell = this.cells[getGridIndexForLocation(x, y + 1, this.gridWidth)];
      nFluxT = !nCell.isEdge ? getNewFlux(dt, cell.fluxT, cell.elevation - nCell.elevation, this.cellSize) : 0;

      // Scaling factor. Scale down outflow if it is more than available volume in the column.
      const currentVolume = cell.waterDepth * cellArea;
      const outVolume = (nFluxL + nFluxR + nFluxT + nFluxB) * dt;
      const k = outVolume > 0 ? Math.min(1,  currentVolume / outVolume) : 1;

      cell.fluxL = k * nFluxL;
      cell.fluxR = k * nFluxR;
      cell.fluxT = k * nFluxT;
      cell.fluxB = k * nFluxB;
    });
  }

  public updateWaterDepth(dt: number) {
    const cellArea = this.cellSize * this.cellSize;
    this.waterSum = 0;

    this.cells.forEach(cell => {
      if (cell.isEdge) {
        return;
      }
      const x = cell.x;
      const y = cell.y;

      const fluxInLeft = this.cells[getGridIndexForLocation(x - 1, y, this.gridWidth)].fluxR;
      const fluxInRight = this.cells[getGridIndexForLocation(x + 1, y, this.gridWidth)].fluxL;
      const fluxInBottom = this.cells[getGridIndexForLocation(x, y - 1, this.gridWidth)].fluxT;
      const fluxInTop = this.cells[getGridIndexForLocation(x, y + 1, this.gridWidth)].fluxB;

      const fluxIn = fluxInLeft + fluxInRight + fluxInTop + fluxInBottom;

      let nWaterDepth = cell.waterDepth + (fluxIn - cell.fluxOut) * dt / (cellArea);
      nWaterDepth = Math.max(0, nWaterDepth);

      cell.waterDepth = nWaterDepth;

      this.waterSum += nWaterDepth;
    });
  }
}
