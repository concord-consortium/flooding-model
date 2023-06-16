import { action, computed, observable, makeObservable } from "mobx";
import { Cell, ICellSnapshot } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig, TimePeriod } from "../config";
import { cellAtGrid, getCellNeighbors4, getCellNeighbors8 } from "./utils/grid-utils";
import { FloodingEngine } from "./engine/flooding-engine";
import { FloodingEngineGPU } from "./engine/flooding-engine-gpu";
import { populateCellsData } from "./utils/load-and-initialize-cells";
import { log } from "@concord-consortium/lara-interactive-api";
import { EventEmitter } from "eventemitter3";
import { RainIntensity, RiverStage } from "../types";
import { getSilverCityPreset } from "../presets";

const MIN_RAIN_DURATION_IN_DAYS = 1;
const MAX_RAIN_DURATION_IN_DAYS = 4;

export type Weather = "sunny" | "partlyCloudy" | "lightRain" | "mediumRain" | "heavyRain" | "extremeRain";

export type Event = "hourChange" | "restart" | "start";

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
  public dataReadyPromise: Promise<void>;
  public engineCPU: FloodingEngine | null = null;
  public engineGPU: FloodingEngineGPU | null = null;
  // Cells are not directly observable. Changes are broadcasted using cellsSimulationStateFlag and cellsBaseStateFlag.
  public cells: Cell[] = [];
  public riverCells: Cell[] = [];
  public edgeCells: Cell[] = [];
  public defaultTimePeriod?: TimePeriod = undefined;

  @observable public config: ISimulationConfig;
  @observable public riverBankSegments: Cell[][] = [];

  @observable public time = 0;
  @observable public dataReady = false;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;

  // Simulation parameters.
  @observable public rainIntensity: RainIntensity = RainIntensity.medium;
  @observable public rainDurationInDays = 2;
  @observable public _initialRiverStage: number = RiverStage.medium;

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
    makeObservable(this);
    if (presetConfig.timePeriod) {
      this.defaultTimePeriod = presetConfig.timePeriod;
    }
    this.load(presetConfig);
    this.setDefaultInputs();
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
    return this.engineCPU?.floodArea || 0;
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
      if (this.rainIntensity === RainIntensity.light) {
        return "lightRain";
      }
      if (this.rainIntensity === RainIntensity.medium) {
        return "mediumRain";
      }
      if (this.rainIntensity === RainIntensity.heavy) {
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

  public get engine() {
    return this.engineGPU || this.engineCPU;
  }

  public get waterDepthTexture() {
    return this.engineGPU?.getWaterDepthTexture();
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
    this.updateCellsWaterSaturation();
    // Update observable crossSectionState array, so cross-section view can re-render itself.
    this.updateCrossSectionStates();
  }

  @action.bound public updateCellsWaterSaturation() {
    for (const cell of this.cells) {
      cell.initialWaterSaturation = this.initialWaterSaturation;
      cell.waterSaturation = this.initialWaterSaturation;
    }
  }

  // Adds or removes levee in the provided river bank.
  @action.bound public toggleLevee(riverBankIdx: number) {
    const leveeHeight = this.config.leveeHeight;
    this.riverBankSegments[riverBankIdx].forEach(cell => {
      cell.leveeHeight = cell.isLevee ? 0 : leveeHeight;
    });
    // Don't use first or last one cell in segment, as they are shared between segments.
    const segmentCell = this.riverBankSegments[riverBankIdx][1];
    const isLevee = segmentCell?.isLevee;
    this.leveesCount += isLevee ? 1 : -1;
    this.updateCellsBaseStateFlag();
    this.updateCrossSectionStates();

    if (isLevee) {
      log("LeveeAdded", { x: segmentCell.x / this.config.gridWidth, y: segmentCell.y / this.config.gridHeight });
    } else {
      log("LeveeRemoved", { x: segmentCell.x / this.config.gridWidth, y: segmentCell.y / this.config.gridHeight });
    }
  }

  @action.bound public async load(presetConfig: Partial<ISimulationConfig>) {
    this.dataReadyPromise = (async () => {
      // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
      // by URL parameters.
      this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
      await this.populateCellsData();
      this.restart();
    })();
    return this.dataReadyPromise;
  }

  @action.bound public async populateCellsData() {
    this.dataReady = false;
    return populateCellsData(this.config).then(result => {
      this.cells = result.cells;
      this.edgeCells = result.edgeCells;
      this.riverCells = result.riverCells;
      this.riverBankSegments = result.riverBankSegments;
      this.leveesCount = 0;

      if (this.config.useGPU) {
        this.engineGPU = new FloodingEngineGPU(this.cells, this.config);
      } else {
        this.engineCPU = new FloodingEngine(this.cells, this.config);
      }

      // Water saturation needs to be set using the input state variable.
      this.updateCellsWaterSaturation();

      this.updateCellsBaseStateFlag();
      this.updateCellsSimulationStateFlag();
      this.updateCrossSectionStates();

      this.dataReady = true;
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

    this.emit("start");
  }

  @action.bound public stop() {
    this.simulationRunning = false;
  }

  @action.bound public setDefaultInputs() {
    this.setRainIntensity(RainIntensity[this.config.rainIntensity]);
    this.setRainDurationInDays(this.config.rainDuration);
    this.setInitialWaterSaturation(RiverStage[this.config.startingWaterLevel]);
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
    if (this.config.useGPU) {
      this.engineGPU = new FloodingEngineGPU(this.cells, this.config);
    } else {
      this.engineCPU = new FloodingEngine(this.cells, this.config);
    }
    this.updateCrossSectionStates();
    this.updateCellsSimulationStateFlag();
    this.emit("restart"); // used by graphs
  }

  @action.bound public reload() {
    if (this.defaultTimePeriod && this.defaultTimePeriod !== this.config.timePeriod) {
      this.load(getSilverCityPreset(this.defaultTimePeriod));
    }
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

    this.tick();
  }

  @action.bound public tick() {
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
        this.engine.update();
      }

      if (this.timeInHours !== oldTimeInHours) {
        // Copy data from GPU to CPU.
        if (this.engineGPU) {
          const { waterDepth, waterSaturation } = this.engineGPU.readWaterOutput();
          const cellsCount = waterDepth.length;
          for (let i = 0; i < cellsCount; i += 1) {
            this.cells[i].waterDepth = waterDepth[i];
            this.cells[i].waterSaturation = waterSaturation[i];
          }
        }
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
