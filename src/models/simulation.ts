import { action, computed, observable } from "mobx";
import { Cell, ICellSnapshot } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { cellAtGrid, getCellNeighbors4, getCellNeighbors8 } from "./utils/grid-utils";
import { FloodingEngine } from "./engine/flooding-engine";
import EventEmitter from "eventemitter3";
import { populateCellsData } from "./utils/load-and-initialize-cells";

const MIN_RAIN_DURATION_IN_DAYS = 1;
const MAX_RAIN_DURATION_IN_DAYS = 4;

export enum RainIntensity {
  Light,
  Medium,
  Heavy,
  Extreme
}

export enum RiverStage {
  Low = 0,
  Medium = 1/3,
  High = 2/3,
  Crest = 1
}

export type Weather = "sunny" | "partlyCloudy" | "lightRain" | "mediumRain" | "heavyRain" | "extremeRain";

export type Event = "hourChange" | "restart";

export interface ICrossSectionState {
  centerCell: Cell;
  leftCell: Cell;
  rightCell: Cell;
  leftLeveeCell: Cell;
  rightLeveeCell: Cell;
}

export interface ISimulationSnapshot {
  time: number;
  cellSnapshots: ICellSnapshot[];
}

// This class is responsible for data loading and general setup. It's more focused
// on management and interactions handling. Core calculations are delegated to FloodingEngine.
// Also, all the observable properties should be here, so the view code can observe them.
export class SimulationModel {
  public config: ISimulationConfig;
  public dataReadyPromise: Promise<void>;
  public engine: FloodingEngine | null = null;
  // Cells are not directly observable. Changes are broadcasted using cellsSimulationStateFlag and cellsBaseStateFlag.
  public cells: Cell[] = [];
  public riverCells: Cell[] = [];
  public edgeCells: Cell[] = [];

  @observable public riverBankSegments: Cell[][] = [];

  @observable public time = 0;
  @observable public dataReady = false;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;

  // Simulation parameters.
  @observable public rainIntensity: RainIntensity = RainIntensity.Medium;
  @observable public rainDurationInDays = 2;
  @observable public _initialRiverStage: number = RiverStage.Medium;

  // Simulation outputs.
  @observable public crossSectionState: ICrossSectionState[] = [];

  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsSimulationStateFlag = 0;
  @observable public cellsBaseStateFlag = 0;
  @observable public leveesCount = 0;

  private emitter = new EventEmitter();

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

  @computed public get initialWaterSaturation() {
    return this._initialRiverStage;
  }

  @computed public get remainingLevees() {
    return this.config.maxLevees - this.leveesCount;
  }

  public get floodArea() { // in square meters
    return this.engine?.floodArea || 0;
  }

  public get crossSections() {
    return this.config.crossSections;
  }

  public getCrossSectionCell(index: number, type: "riverGauge" | "leftLevee" | "rightLevee" | "leftLandGauge" | "rightLandGauge") {
    const cs = this.crossSections[index];
    const coords = cs[type];
    return this.cellAtGrid(Math.round(this.config.gridWidth * coords.x), Math.round(this.config.gridHeight * coords.y));
  }

  public getRiverDepth(gaugeIndex: number) {
    const cs = this.crossSections[gaugeIndex];
    if (!cs) {
      return 0;
    }
    const gaugeCell = this.getCrossSectionCell(gaugeIndex, "riverGauge");
    if (!gaugeCell) {
      return 0;
    }
    return cs.minRiverDepth + (cs.maxRiverDepth - cs.minRiverDepth) * gaugeCell.waterSaturation + gaugeCell.waterDepth;
  }

  public getCrossSectionState(index: number) {
    return {
      centerCell: this.getCrossSectionCell(index, "riverGauge"),
      leftCell: this.getCrossSectionCell(index, "leftLandGauge"),
      rightCell: this.getCrossSectionCell(index, "rightLandGauge"),
      leftLeveeCell: this.getCrossSectionCell(index, "leftLevee"),
      rightLeveeCell: this.getCrossSectionCell(index, "rightLevee")
    } as ICrossSectionState;
  }

  // Update observable crossSectionState array, so cross-section view can re-render itself.
  // It's impossible to observe method results directly (e.g. getRiverDepth).
  public updateCrossSectionStates() {
    this.crossSectionState = this.crossSections.map((g, idx) => this.getCrossSectionState(idx));
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

  public cellAtGrid(gridX: number, gridY: number) {
    return cellAtGrid(gridX, gridY, this.cells, this.config.gridWidth, this.config.gridHeight);
  }

  public getCellNeighbors4(cell: Cell) {
    return getCellNeighbors4(cell, this.cells, this.config.gridWidth, this.config.gridHeight);
  }

  public getCellNeighbors8(cell: Cell) {
    return getCellNeighbors8(cell, this.cells, this.config.gridWidth, this.config.gridHeight);
  }

  public cellAt(xInM: number, yInM: number) {
    const gridX = Math.floor(xInM / this.config.cellSize);
    const gridY = Math.floor(yInM / this.config.cellSize);
    return this.cellAtGrid(gridX, gridY);
  }

  @action.bound public setRainIntensity(value: number) {
    this.rainIntensity = value;
  }

  @action.bound public setRainDurationInDays(value: number) {
    this.rainDurationInDays = Math.max(MIN_RAIN_DURATION_IN_DAYS, Math.min(MAX_RAIN_DURATION_IN_DAYS, value));
  }

  @action.bound public setInitialWaterSaturation(value: number) {
    this._initialRiverStage = value;
    for (const cell of this.cells) {
      cell.initialWaterSaturation = value;
      cell.waterSaturation = value;
    }
    // Update observable crossSectionState array, so cross-section view can re-render itself.
    this.updateCrossSectionStates();
  }

  // Adds or removes levee in the provided river bank.
  @action.bound public toggleLevee(riverBankIdx: number) {
    const leveeHeight = this.config.leveeHeight;
    this.riverBankSegments[riverBankIdx].forEach(cell => {
      cell.leveeHeight = cell.isLevee ? 0 : leveeHeight;
    });
    const isLevee = this.riverBankSegments[riverBankIdx][0].isLevee;
    this.leveesCount += isLevee ? 1 : -1;
    this.updateCellsBaseStateFlag();
    this.updateCrossSectionStates();
  }

  @action.bound public async load(presetConfig: Partial<ISimulationConfig>) {
    // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
    // by URL parameters.
    this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
    await this.populateCellsData();
    this.setDefaultInputs();
    this.restart();
  }

  @action.bound public async populateCellsData() {
    this.dataReady = false;
    this.dataReadyPromise = populateCellsData(this.config).then(result => {
      this.cells = result.cells;
      this.edgeCells = result.edgeCells;
      this.riverCells = result.riverCells;
      this.riverBankSegments = result.riverBankSegments;

      this.dataReady = true;
      this.engine = new FloodingEngine(this.cells, this.config);

      this.updateCellsBaseStateFlag();
      this.updateCellsSimulationStateFlag();
      });
    return this.dataReadyPromise;
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

  @action.bound public setDefaultInputs() {
    this.setRainIntensity(RainIntensity.Medium);
    this.setRainDurationInDays(2);
    this.setInitialWaterSaturation(RiverStage.Medium);
    this.cells.forEach(c => {
      c.leveeHeight = 0;
    });
    this.leveesCount = 0;
    this.updateCellsBaseStateFlag();
  }

  @action.bound public restart() {
    this.simulationRunning = false;
    this.simulationStarted = false;
    this.cells.forEach(cell => cell.reset());
    this.time = 0;
    this.engine = new FloodingEngine(this.cells, this.config);
    this.updateCrossSectionStates();
    this.updateCellsSimulationStateFlag();
    this.emit("restart"); // used by graphs
  }

  @action.bound public reload() {
    this.setDefaultInputs();
    this.restart();
  }

  @action.bound public rafCallback() {
    if (this.timeInDays >= this.config.simulationLength) {
      this.stop();
    }
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
            // this._riverStage += this.currentRiverWaterIncrement * this.config.riverStageIncreaseSpeed;
          this.engine.waterSaturationIncrement = this.currentRiverWaterIncrement;
        }
        this.engine.update(this.config.timeStep);
      }

      if (this.engine.simulationDidStop) {
        this.simulationRunning = false;
      }

      if (this.timeInHours !== oldTimeInHours) {
        this.emit("hourChange"); // used by graphs
      }
    }

    this.updateCellsSimulationStateFlag();
    // Update observable crossSectionState array, so cross-section view can re-render itself.
    this.updateCrossSectionStates();
  }

  @action.bound public updateCellsBaseStateFlag() {
    this.cellsBaseStateFlag += 1;
  }

  @action.bound public updateCellsSimulationStateFlag() {
    this.cellsSimulationStateFlag += 1;
  }

  public snapshot(): ISimulationSnapshot {
    return {
      time: this.time,
      cellSnapshots: this.cells.map(c => c.snapshot())
    };
  }

  public restoreSnapshot(snapshot: ISimulationSnapshot) {
    this.time = snapshot.time;
    snapshot.cellSnapshots.forEach((cellSnapshot, idx) => {
      this.cells[idx].restoreSnapshot(cellSnapshot);
    });
    this.updateCellsBaseStateFlag();
    this.updateCellsSimulationStateFlag();
    this.updateCrossSectionStates();
  }
}
