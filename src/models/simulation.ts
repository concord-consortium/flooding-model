import { action, computed, observable } from "mobx";
import { Cell, CellOptions } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { getElevationData, getPermeabilityData, getRiverData, getWaterDepthData } from "./utils/data-loaders";
import { getGridIndexForLocation } from "./utils/grid-utils";
import { FloodingEngine } from "./engine/flooding-engine";

const MIN_RAIN_DURATION_IN_DAYS = 1;
const MAX_RAIN_DURATION_IN_DAYS = 4;

export const LIGHT_RAIN_INTENSITY = 0.25;
export const MEDIUM_RAIN_INTENSITY = 0.50;
export const HEAVY_RAIN_INTENSITY = 0.75;
export const EXTREME_RAIN_INTENSITY = 1;

// This class is responsible for data loading and general setup. It's more focused
// on management and interactions handling. Core calculations are delegated to FloodingEngine.
// Also, all the observable properties should be here, so the view code can observe them.
export class SimulationModel {
  public config: ISimulationConfig;
  public dataReadyPromise: Promise<void>;
  public engine: FloodingEngine | null = null;
  // Cells are not directly observable. Changes are broadcasted using cellsStateFlag and cellsBaseElevationFlag.
  public cells: Cell[] = [];
  @observable public time = 0;
  @observable public dataReady = false;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;

  // Simulation parameters.
  @observable public rainIntensity = MEDIUM_RAIN_INTENSITY; // [0, 1]
  @observable public rainDurationInDays = 2;
  @observable public initialWaterLevel = 0.5; // [0, 1]

  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsStateFlag = 0;
  @observable public cellsBaseElevationFlag = 0;

  constructor(presetConfig: Partial<ISimulationConfig>) {
    this.load(presetConfig);
  }

  @computed public get ready() {
    return this.dataReady;
  }

  @computed public get gridWidth() {
    return this.config.gridWidth;
  }

  @computed public get gridHeight() {
    return this.config.gridHeight;
  }

  @computed public get timeInHours() {
    return Math.floor(this.time * this.config.modelTimeToHours);
  }

  @computed public get timeInDays() {
    return Math.floor(this.time * this.config.modelTimeToHours) / 24;
  }

  @computed public get weather() {
    if (this.timeInDays < this.rainDurationInDays) {
      if (this.rainIntensity <= LIGHT_RAIN_INTENSITY) {
        return "lightRain";
      }
      if (this.rainIntensity <= MEDIUM_RAIN_INTENSITY) {
        return "mediumRain";
      }
      if (this.rainIntensity <= HEAVY_RAIN_INTENSITY) {
        return "heavyRain";
      }
      return "extremeRain";
    }
    if (this.timeInDays < this.rainDurationInDays + 2) {
      return "partlyCloudy";
    }
    return "sunny";
  }

  public cellAt(xInM: number, yInM: number) {
    const gridX = Math.floor(xInM / this.config.cellSize);
    const gridY = Math.floor(yInM / this.config.cellSize);
    return this.cells[getGridIndexForLocation(gridX, gridY, this.config.gridWidth)];
  }

  @action.bound public setRainIntensity(value: number) {
    this.rainIntensity = value;
  }

  @action.bound public setRainDurationInDays(value: number) {
    this.rainDurationInDays = Math.max(MIN_RAIN_DURATION_IN_DAYS, Math.min(MAX_RAIN_DURATION_IN_DAYS, value));
  }

  @action.bound public setInitialWaterLevel(value: number) {
    this.initialWaterLevel = value;
  }

  @action.bound public load(presetConfig: Partial<ISimulationConfig>) {
    // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
    // by URL parameters.
    this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
    this.populateCellsData();
    this.restart();
  }

  @action.bound public populateCellsData() {
    this.dataReady = false;
    const config = this.config;
    this.dataReadyPromise = Promise.all([
      getElevationData(config), getRiverData(config), getWaterDepthData(config), getPermeabilityData(config)
    ]).then(values => {
      const elevation = values[0];
      const river = values[1];
      const waterDepth = values[2];
      const permeability = values[3];
      const elevationDiff = this.config.maxElevation - this.config.minElevation;
      const verticalTilt = (this.config.elevationVerticalTilt / 100) * elevationDiff;

      this.cells.length = 0;

      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const index = getGridIndexForLocation(x, y, this.gridWidth);
          const isRiver = river && river[index] > 0;
          // When fillTerrainEdge is set to true, edges are set to elevation 0.
          const isEdge = config.fillTerrainEdges &&
            (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight - 1);
          let baseElevation = elevation && elevation[index];
          if (verticalTilt && baseElevation !== undefined) {
            const vertProgress = y / this.gridHeight;
            baseElevation += Math.abs(verticalTilt) * (verticalTilt > 0 ? vertProgress : 1 - vertProgress);
          }
          if (isEdge) {
            baseElevation = 0;
          }
          const cellOptions: CellOptions = {
            x, y,
            isEdge,
            isRiver,
            baseElevation,
            waterDepth: waterDepth && waterDepth[index] || 0,
            permeability: isRiver ? 0 : (permeability && permeability[index] || 0)
          };
          this.cells.push(new Cell(cellOptions));
        }
      }
      this.updateCellsBaseElevationFlag();
      this.updateCellsStateFlag();
      this.dataReady = true;

      this.engine = new FloodingEngine(this.cells, this.config);
    });
  }

  @action.bound public start() {
    if (!this.ready) {
      return;
    }
    if (!this.simulationStarted) {
      this.simulationStarted = true;
    }

    this.simulationRunning = true;

    requestAnimationFrame(this.rafCallback);
  }

  @action.bound public stop() {
    this.simulationRunning = false;
  }

  @action.bound public restart() {
    this.simulationRunning = false;
    this.simulationStarted = false;
    this.cells.forEach(cell => cell.reset());
    this.updateCellsStateFlag();
    this.time = 0;
    this.engine = new FloodingEngine(this.cells, this.config);
  }

  @action.bound public reload() {
    // No difference between restart for now.
    this.restart();
  }

  @action.bound public rafCallback() {
    if (!this.simulationRunning) {
      return;
    }
    requestAnimationFrame(this.rafCallback);

    if (this.engine) {
      for (let i = 0; i < this.config.speedMult; i += 1) {
        this.time += this.config.timeStep;
        this.engine.update(this.config.timeStep);
      }
      if (this.engine.simulationDidStop) {
        this.simulationRunning = false;
      }
    }

    this.updateCellsStateFlag();
  }

  @action.bound public updateCellsBaseElevationFlag() {
    this.cellsBaseElevationFlag += 1;
  }

  @action.bound public updateCellsStateFlag() {
    this.cellsStateFlag += 1;
  }
}
