import { Cell } from "../cell";
import { getGridIndexForLocation, directNeighbors } from "../utils/grid-utils";

export interface IFireEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

const WATER_LOSS_PER_STEP = 0.05; // m

// Lightweight helper that is responsible only for math calculations. It's not bound to MobX or any UI state
// (it's role of the Simulation model). Config properties are explicitly listed, so it's clear
// which config options are responsible for simulation progress.
export class FloodingEngine {
  public cells: Cell[];
  public gridWidth: number;
  public gridHeight: number;
  public cellSize: number;
  public simulationDidStop = false;
  public waterSum = 0;

  constructor(cells: Cell[], config: IFireEngineConfig) {
    this.cells = cells;
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
  }

  public update() {
    const newWaterDepth: number[] = [];
    this.waterSum = 0;

    this.cells.forEach((cell, idx) => {
      const x = cell.x;
      const y = cell.y;
      this.waterSum += cell.waterDepth;

      // Boundary conditions.
      if (cell.isEdge) {
        let nIdx;
        if (x === 0) {
          nIdx = getGridIndexForLocation(x + 1, y, this.gridWidth);
        } else if (x > 0) {
          nIdx = getGridIndexForLocation(x - 1, y, this.gridWidth);
        } else if (y === 0) {
          nIdx = getGridIndexForLocation(x, y + 1, this.gridWidth);
        } else { // if (y > 0)
          nIdx = getGridIndexForLocation(x, y - 1, this.gridWidth);
        }
        newWaterDepth[idx] = this.cells[nIdx].waterDepth;
        return;
      }

      let neighborsElevationSum = 0;
      let neighborsWaterSum = 0;
      let activeNeighbors = 0;
      directNeighbors.forEach((diff: {x: number, y: number}) => {
        const nIdx = getGridIndexForLocation(x + diff.x, y + diff.y, this.gridWidth);
        const nCell = this.cells[nIdx];

        if (nCell.waterDepth === 0 && nCell.baseElevation > cell.elevation) {
          return;
        }

        neighborsElevationSum += nCell.elevation;
        neighborsWaterSum += nCell.waterDepth;
        activeNeighbors += 1;
      });

      let velocityDiff = activeNeighbors > 0 ? (neighborsElevationSum / activeNeighbors) - cell.elevation : 0;
      if (velocityDiff > 0) {
        velocityDiff = Math.min(velocityDiff, neighborsWaterSum);
      } else if (velocityDiff < 0) {
        velocityDiff = -1 * Math.min(Math.abs(velocityDiff), neighborsWaterSum);
      }
      cell.velocity += velocityDiff;
      cell.velocity *= 0.9;

      newWaterDepth[idx] = Math.max(0, cell.waterDepth + cell.velocity);
    });

    this.cells.forEach((cell, idx) => {
      cell.waterDepth = newWaterDepth[idx];
      if (!cell.isRiver) {
        cell.waterDepth -= WATER_LOSS_PER_STEP;
      }
      cell.waterDepth = Math.max(cell.waterDepth, 0);
    });
  }
}
