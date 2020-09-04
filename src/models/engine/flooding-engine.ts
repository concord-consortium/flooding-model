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
import { RiverStage } from "../simulation";

export interface IFloodingEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  floodPermeabilityMult?: number;
  dampingFactor?: number;
  riverStageIncreaseSpeed?: number;
}

const GRAVITY = 9.81;
// PIPE_FACTOR can help with instabilities. Might need to be adjusted for different grid sizes and timesteps.
const PIPE_FACTOR = 0.025;

const EDGE_CELL = new Cell({ x: -1, y: -1, isEdge: true });
EDGE_CELL.fluxL = EDGE_CELL.fluxR = EDGE_CELL.fluxT = EDGE_CELL.fluxB = 0;

const getNewFlux = (dt: number, oldFlux: number, heightDiff: number, cellArea: number) => {
  return Math.max(0, oldFlux + GRAVITY * PIPE_FACTOR * cellArea * dt * heightDiff);
};

export class FloodingEngine {
  public cells: Cell[];
  public activeCells: Cell[];
  public riverCells: Cell[];

  public gridWidth: number;
  public gridHeight: number;
  public cellSize: number;
  public dampingFactor: number;
  public floodPermeabilityMult: number;
  public riverStageIncreaseSpeed: number;

  // Outputs
  public simulationDidStop = false;
  public waterSum = 0;
  public riverWaterSum = 0;
  public riverWaterIncrement = 0;
  public floodArea = 0; // in square meters

  constructor(cells: Cell[], config: IFloodingEngineConfig) {
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
    this.dampingFactor = config.dampingFactor !== undefined ? config.dampingFactor : 0.99;
    this.floodPermeabilityMult = config.floodPermeabilityMult !== undefined ? config.floodPermeabilityMult : 1;
    this.riverStageIncreaseSpeed = config.riverStageIncreaseSpeed !== undefined ? config.riverStageIncreaseSpeed : 0.125;

    this.cells = cells;
    // "Edge" cells exist only to make rendering a bit simpler. Skip them entirely in the simulation.
    this.activeCells = cells.filter(c => !c.isEdge);
    this.riverCells = cells.filter(c => c.isRiver && !c.isEdge);
  }

  public getCellAt(x: number, y: number) {
    // This condition is useful if model is not using edge cells. It makes tests easier.
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return EDGE_CELL;
    }
    return this.cells[getGridIndexForLocation(x, y, this.gridWidth)];
  }

  public update(dt: number) {
    this.removeWater(dt);
    this.addWaterInRiver(dt);
    this.updateFlux(dt);
    this.updateWaterDepth(dt);
  }

  public addWaterInRiver(dt: number) {
    for (const cell of this.cells) {
      // When river is still not overflowing (riverStage <= 1), only riverStage value gets updated during this step.
      // When riverStage gets bigger than 1, waterDepth is incremented too, which will trigger the flooding
      // calculations in other steps.
      if (cell.riverStage <= 1) {
        const riverStageDiff = this.riverWaterIncrement * dt * this.riverStageIncreaseSpeed;
        cell.riverStage += this.riverWaterIncrement * dt * this.riverStageIncreaseSpeed;
        if (riverStageDiff < 0) {
          const finalRiverStage = Math.min(cell.initialRiverStage + 0.2, RiverStage.High);
          cell.riverStage = Math.max(cell.riverStage, finalRiverStage);
        }
      } else {
        if (cell.isRiver) {
          cell.waterDepth = Math.max(0, cell.waterDepth + this.riverWaterIncrement * dt);
        }
        if (cell.waterDepth === 0) {
          // If we're here, it means that river has flooded, but not it's back to normal state (riverWaterIncrement
          // is negative). Start decreasing riverStage value when waterDepth reaches 0.
          cell.riverStage = 1;
        }
      }
    }
  }

  public removeWater(dt: number) {
    for (const cell of this.activeCells) {
      if (cell.waterDepth === 0) {
        continue;
      }
      // During the flood event ground permeability is much lower than typically, as the water table is very high.
      const flood = this.riverWaterIncrement > 0;
      cell.waterDepth -= cell.permeability * dt * (flood ? this.floodPermeabilityMult : 1);
      cell.waterDepth = Math.max(0, cell.waterDepth);
    }
  }

  public updateFlux(dt: number) {
    let nFluxL: number, nFluxR: number, nFluxB: number, nFluxT: number;
    const cellArea = this.cellSize * this.cellSize;

    for (const cell of this.activeCells) {
      const x = cell.x;
      const y = cell.y;
      let nCell;

      // fluxL
      nCell = this.getCellAt(x - 1, y);
      nFluxL = !nCell.isEdge ? getNewFlux(dt, cell.fluxL, cell.elevation - nCell.elevation, cellArea) * this.dampingFactor : 0;
      // fluxR
      nCell = this.getCellAt(x + 1, y);
      nFluxR = !nCell.isEdge ? getNewFlux(dt, cell.fluxR, cell.elevation - nCell.elevation, cellArea) * this.dampingFactor : 0;
      // fluxB
      nCell = this.getCellAt(x, y - 1);
      nFluxB = !nCell.isEdge ? getNewFlux(dt, cell.fluxB, cell.elevation - nCell.elevation, cellArea) * this.dampingFactor : 0;
      // fluxT
      nCell = this.getCellAt(x, y + 1);
      nFluxT = !nCell.isEdge ? getNewFlux(dt, cell.fluxT, cell.elevation - nCell.elevation, cellArea) * this.dampingFactor : 0;

      // Scaling factor. Scale down outflow if it is more than available volume in the column.
      const currentVolume = cell.waterDepth * cellArea;
      const outVolume = (nFluxL + nFluxR + nFluxT + nFluxB) * dt;
      const k = outVolume > 0 ? Math.min(1,  currentVolume / outVolume) : 1;

      cell.fluxL = k * nFluxL;
      cell.fluxR = k * nFluxR;
      cell.fluxT = k * nFluxT;
      cell.fluxB = k * nFluxB;
    }
  }

  public updateWaterDepth(dt: number) {
    const cellArea = this.cellSize * this.cellSize;
    this.waterSum = 0;
    this.riverWaterSum = 0;
    this.floodArea = 0;

    for (const cell of this.activeCells) {
      if (cell.isEdge) {
        continue;
      }
      const x = cell.x;
      const y = cell.y;

      const fluxInLeft = this.getCellAt(x - 1, y).fluxR;
      const fluxInRight = this.getCellAt(x + 1, y).fluxL;
      const fluxInBottom = this.getCellAt(x, y - 1).fluxT;
      const fluxInTop = this.getCellAt(x, y + 1).fluxB;

      const fluxIn = fluxInLeft + fluxInRight + fluxInTop + fluxInBottom;

      cell.waterDepth = Math.max(0, cell.waterDepth + (fluxIn - cell.fluxOut) * dt / (cellArea));

      this.waterSum += cell.waterDepth;
      if (cell.isRiver) {
        this.riverWaterSum += cell.waterDepth;
      }
      if (cell.waterDepth > 0.01) {
        this.floodArea += cellArea;
      }
    }
  }
}
