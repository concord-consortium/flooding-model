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
// More resources:
// - https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
// - https://profs.etsmtl.ca/epaquette/Research/Papers/Dagenais.2018/Dagenais-2018.pdf

import { Cell } from "../cell";
import { getGridIndexForLocation } from "../utils/grid-utils";
import { RiverStage } from "../../types";

export interface IFloodingEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  floodPermeabilityMult?: number;
  dampingFactor?: number;
  riverStageIncreaseSpeed?: number;
  timeStep: number;
}

const GRAVITY = 0.25;
const EDGE_CELL = new Cell({ x: -1, y: -1, isEdge: true });
EDGE_CELL.fluxL = EDGE_CELL.fluxR = EDGE_CELL.fluxT = EDGE_CELL.fluxB = 0;

const getNewFlux = (dt: number, oldFlux: number, heightDiff: number, cellSize: number) => {
  return Math.max(0, oldFlux + dt * cellSize * GRAVITY * heightDiff);
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
  public dt: number;
  public riverStageIncreaseSpeed: number;

  public waterSaturationIncrement = 0;

  // Outputs
  public waterSum = 0;
  public riverWaterSum = 0;
  public floodArea = 0; // in square meters

  constructor(cells: Cell[], config: IFloodingEngineConfig) {
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
    this.dampingFactor = config.dampingFactor !== undefined ? config.dampingFactor : 0.99;
    this.floodPermeabilityMult = config.floodPermeabilityMult !== undefined ? config.floodPermeabilityMult : 1;
    this.riverStageIncreaseSpeed = config.riverStageIncreaseSpeed !== undefined ? config.riverStageIncreaseSpeed : 0.125;
    this.dt = config.timeStep || 1;

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

  public update(dt = this.dt) {
    this.removeWater(dt);
    this.addWater(dt);
    this.updateWaterDepth(dt);
    this.updateFlux(dt);
  }

  public addWater(dt: number) {
    for (const cell of this.cells) {
      // When river is still not overflowing (waterSaturation <= 1), only waterSaturation value gets updated during this step.
      // When waterSaturation gets bigger than 1, waterDepth is incremented too, which will trigger the flooding
      // calculations in other steps.
      if (cell.waterSaturation <= 1) {
        const riverStageDiff = this.waterSaturationIncrement * dt * this.riverStageIncreaseSpeed;
        cell.waterSaturation += riverStageDiff;
        cell.waterSaturation = Math.min(1 + 1e-6, cell.waterSaturation);
        if (riverStageDiff < 0) {
          const finalRiverStage = Math.min(cell.initialWaterSaturation + 0.2, RiverStage.high);
          cell.waterSaturation = Math.max(cell.waterSaturation, finalRiverStage);
        }
      } else {
        // Only rivers can actually overflow above the surface level.
        if (cell.isRiver) {
          cell.waterDepth = Math.max(0, cell.waterDepth + this.waterSaturationIncrement * dt);
        }
        if (cell.waterDepth === 0) {
          // If we're here, it means that river has flooded, but not it's back to normal state (waterSaturationIncrement
          // is negative). Start decreasing waterSaturation value when waterDepth reaches 0.
          cell.waterSaturation = 1;
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
      const flood = this.waterSaturationIncrement > 0;
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
      nFluxL = !nCell.isEdge ? getNewFlux(dt, cell.fluxL, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxR
      nCell = this.getCellAt(x + 1, y);
      nFluxR = !nCell.isEdge ? getNewFlux(dt, cell.fluxR, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxB
      nCell = this.getCellAt(x, y - 1);
      nFluxB = !nCell.isEdge ? getNewFlux(dt, cell.fluxB, cell.elevation - nCell.elevation, this.cellSize) : 0;
      // fluxT
      nCell = this.getCellAt(x, y + 1);
      nFluxT = !nCell.isEdge ? getNewFlux(dt, cell.fluxT, cell.elevation - nCell.elevation, this.cellSize) : 0;

      // Scaling factor. Scale down outflow if it is more than available volume in the column.
      const currentVolume = cell.waterDepth * cellArea;
      const outVolume = (nFluxL + nFluxR + nFluxT + nFluxB) * dt;
      const k = (outVolume > 0 ? Math.min(1, currentVolume / outVolume) : 1) * this.dampingFactor;

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

      cell.waterDepth = Math.max(0, cell.waterDepth + (fluxIn - cell.fluxOut) * dt / cellArea);

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
