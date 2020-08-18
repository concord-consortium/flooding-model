import { action, computed, observable } from "mobx";
import { Cell, CellOptions } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { getElevationData, getPermeabilityData, getRiverData, getWaterDepthData } from "./utils/data-loaders";
import { getGridIndexForLocation } from "./utils/grid-utils";
import { FloodingEngine } from "./engine/flooding-engine";
import EventEmitter from "eventemitter3";

const MIN_RAIN_DURATION_IN_DAYS = 1;
const MAX_RAIN_DURATION_IN_DAYS = 4;

export enum RainIntensity {
  Light,
  Medium,
  Heavy,
  Extreme
}

export enum RiverStage {
  Low = 0.25,
  Medium = 0.50,
  High = 0.75,
  Crest = 1.0
}

// River is not flowing in the model. Instead, it disappears from the river faster than from the ground.
const RIVER_PERMEABILITY = 0.012;

export type Weather = "sunny" | "partlyCloudy" | "lightRain" | "mediumRain" | "heavyRain" | "extremeRain";

export type Event = "hourChange" | "restart";

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
  @observable public rainIntensity: RainIntensity;
  @observable public rainDurationInDays: number;
  @observable public initialWaterLevel: number; // [0, 1]

  // Simulation outputs.
  @observable private _riverStage: number;

  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsStateFlag = 0;
  @observable public cellsBaseElevationFlag = 0;

  private emitter = new EventEmitter();

  constructor(presetConfig: Partial<ISimulationConfig>) {
    this.load(presetConfig);
    this.resetInputs();
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

  @computed public get riverStage() {
    return this._riverStage;
  }

  public get floodArea() { // in square meters
    return this.engine?.floodArea || 0;
  }

  public get gauges() {
    return this.config.gauges;
  }

  public getGaugeReading(index: number) {
    const gauge = this.gauges[index];
    if (!gauge) {
      return 0;
    }
    if (this.riverStage <= 1) {
      return gauge.minDepth + (gauge.maxDepth - gauge.minDepth) * this.riverStage;
    } else {
      const gaugeCell = this.cellAt(this.config.modelWidth * gauge.x, this.config.modelHeight * gauge.y);
      return gauge.maxDepth + gaugeCell.waterDepth;
    }
  }

  @computed public get weather(): Weather {
    const rainStart = this.config.rainStartDay;
    if (this.timeInDays < rainStart) {
      return "partlyCloudy";
    }
    if (this.timeInDays >= rainStart && this.timeInDays < rainStart + this.rainDurationInDays) {
      if (this.rainIntensity === RainIntensity.Light) {
        return "lightRain";
      }
      if (this.rainIntensity === RainIntensity.Medium) {
        return "mediumRain";
      }
      if (this.rainIntensity === RainIntensity.Heavy) {
        return "heavyRain";
      }
      return "extremeRain";
    }
    return "sunny";
  }

  public get currentRiverWaterIncrement() {
    const weather = this.weather;
    if (weather === "lightRain") {
      return this.config.rainStrength[0];
    }
    if (weather === "mediumRain") {
      return this.config.rainStrength[1];
    }
    if (weather === "heavyRain") {
      return this.config.rainStrength[2];
    }
    if (weather === "extremeRain") {
      return this.config.rainStrength[3];
    }
    if (weather === "partlyCloudy") {
      return 0;
    }
    // Sunny.
    return -0.0025;
  }

  public on(event: Event, callback: any) {
    this.emitter.on(event, callback);
  }

  public off(event: Event, callback: any) {
    this.emitter.off(event, callback);
  }

  public emit(event: Event) {
    this.emitter.emit(event);
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
    this._riverStage = value;
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
            permeability: isRiver ? RIVER_PERMEABILITY : (permeability && permeability[index] || 0)
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

  @action.bound public resetInputs() {
    this.rainIntensity = RainIntensity.Medium;
    this.rainDurationInDays = 2;
    this.initialWaterLevel = 0.5;
    this._riverStage = this.initialWaterLevel;
  }

  @action.bound public restart() {
    this.simulationRunning = false;
    this.simulationStarted = false;
    this.cells.forEach(cell => cell.reset());
    this.updateCellsStateFlag();
    this.time = 0;
    this._riverStage = this.initialWaterLevel;
    this.engine = new FloodingEngine(this.cells, this.config);
    this.emit("restart"); // used by graphs
  }

  @action.bound public reload() {
    this.resetInputs();
    this.restart();
  }

  @action.bound public rafCallback() {
    if (!this.simulationRunning) {
      return;
    }
    requestAnimationFrame(this.rafCallback);

    if (this.engine) {
      const oldTimeInHours = this.timeInHours;
      if (this.timeInHours === 0) {
        // Used by graphs. Make sure that initial point (0) is handled by graphs.
        this.emit("hourChange");
      }
      for (let i = 0; i < this.config.speedMult; i += 1) {

        this.time += this.config.timeStep;

        if (this.time > this.config.rainStartDay) {
          if (this._riverStage < 1) {
            // At the beginning of simulation there should be no flood until riverStage value reaches value 1.
            // riverStage value will be used in the future by the cross-section view and river gauge readings.
            this._riverStage += this.currentRiverWaterIncrement * this.config.riverStageIncreaseSpeed;
            this.engine.riverWaterIncrement = 0;
          } else {
            this.engine.riverWaterIncrement = this.currentRiverWaterIncrement;
          }
        }

        // Why do we run simulation engine even when its riverWaterIncrement == 0 and waste CPU cycles?
        // To ensure that the initial part of the simulation, which updates riverStage only, doesn't run much faster
        // than the following part which actually uses computationally expensive FloodingEngine.
        this.engine.update(this.config.timeStep);
      }
      if (this.engine.simulationDidStop) {
        this.simulationRunning = false;
      }
      if (this.timeInHours !== oldTimeInHours) {
        this.emit("hourChange"); // used by graphs
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
