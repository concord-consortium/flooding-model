import { action, computed, observable } from "mobx";
import { Cell } from "./cell";
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
  Low = 0,
  Medium = 1/3,
  High = 2/3,
  Crest = 1
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
  @observable public gaugeReading: number[] = [];

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

  @computed public get initialRiverStage() {
    return this._initialRiverStage;
  }

  @computed public get remainingLevees() {
    return this.config.maxLevees - this.leveesCount;
  }

  public get floodArea() { // in square meters
    return this.engine?.floodArea || 0;
  }

  public get gauges() {
    return this.config.gauges;
  }

  public getGaugeCell(index: number) {
    const gauge = this.gauges[index];
    if (!gauge) {
      return null;
    }
    return this.cellAt(this.config.modelWidth * gauge.x, this.config.modelHeight * gauge.y);
  }

  public getGaugeReading(index: number) {
    const gauge = this.gauges[index];
    if (!gauge) {
      return 0;
    }
    const gaugeCell = this.getGaugeCell(index);
    if (!gaugeCell) {
      return 0;
    }
    return gauge.minRiverDepth + (gauge.maxRiverDepth - gauge.minRiverDepth) * gaugeCell.riverStage  + gaugeCell.waterDepth;
  }

  // Update observable gaugeReading array, so cross-section view can re-render itself.
  // It's impossible to observe method results directly (getGaugeReading).
  public updateGaugeReadings() {
    this.gaugeReading = this.gauges.map((g, idx) => this.getGaugeReading(idx));
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
    if (gridX < 0 || gridX >= this.config.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return undefined;
    }
    return this.cells[getGridIndexForLocation(gridX, gridY, this.config.gridWidth)];
  }

  public cellAt(xInM: number, yInM: number) {
    const gridX = Math.floor(xInM / this.config.cellSize);
    const gridY = Math.floor(yInM / this.config.cellSize);
    return this.cellAtGrid(gridX, gridY);
  }

  public getCellNeighbors4(cell: Cell) {
    return [
      this.cellAtGrid(cell.x - 1, cell.y),
      this.cellAtGrid(cell.x + 1, cell.y),
      this.cellAtGrid(cell.x, cell.y - 1),
      this.cellAtGrid(cell.x, cell.y + 1)
    ].filter(c => c !== undefined) as Cell[];
  }

  public getCellNeighbors8(cell: Cell) {
    return [
      this.cellAtGrid(cell.x - 1, cell.y),
      this.cellAtGrid(cell.x + 1, cell.y),
      this.cellAtGrid(cell.x, cell.y - 1),
      this.cellAtGrid(cell.x, cell.y + 1),
      this.cellAtGrid(cell.x - 1, cell.y - 1),
      this.cellAtGrid(cell.x + 1, cell.y + 1),
      this.cellAtGrid(cell.x - 1, cell.y + 1),
      this.cellAtGrid(cell.x + 1, cell.y - 1)
    ].filter(c => c !== undefined) as Cell[];
  }

  @action.bound public setRainIntensity(value: number) {
    this.rainIntensity = value;
  }

  @action.bound public setRainDurationInDays(value: number) {
    this.rainDurationInDays = Math.max(MIN_RAIN_DURATION_IN_DAYS, Math.min(MAX_RAIN_DURATION_IN_DAYS, value));
  }

  @action.bound public setInitialRiverStage(value: number) {
    this._initialRiverStage = value;
    for (const cell of this.riverCells) {
      cell.initialRiverStage = value;
      cell.riverStage = value;
    }
    // Update observable gaugeReading array, so cross-section view can re-render itself.
    this.updateGaugeReadings();
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
      this.edgeCells.length = 0;

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
          const cell = new Cell({
            id: index,
            x, y,
            isEdge,
            isRiver,
            baseElevation,
            waterDepth: waterDepth && waterDepth[index] || 0,
            permeability: isRiver ? RIVER_PERMEABILITY : (permeability && permeability[index] || 0)
          });

          this.cells.push(cell);

          if (cell.isRiver) {
            this.riverCells.push(cell);
          }
          if (cell.isEdge) {
            this.edgeCells.push(cell);
          }
        }
      }
      this.markShoreIndices();
      this.markRiverBanks();
      this.updateCellsBaseStateFlag();
      this.updateCellsSimulationStateFlag();
      this.dataReady = true;

      this.engine = new FloodingEngine(this.cells, this.config);
    });
    return this.dataReadyPromise;
  }

  // Model area is divided into distinct areas by rivers. Each area will get different index. Useful while generating
  // river bank segments (to ensure that one segment doesn't cross the river).
  @action.bound public markShoreIndices() {
    let shoreIdx = 0;

    const markShoreArea = (cell: Cell) => {
      cell.shoreIdx = shoreIdx;
      const queue = [cell];
      while (queue.length > 0) {
        const c = queue.shift();
        if (!c) {
          continue;
        }
        this.getCellNeighbors4(c).forEach(n => {
          if (!n.isRiver && n.shoreIdx === -1) {
            n.shoreIdx = shoreIdx;
            queue.push(n);
          }
        });
      }
      shoreIdx += 1;
    };

    for (const cell of this.edgeCells) {
      if (!cell.isRiver && cell.shoreIdx === -1) {
        markShoreArea(cell);
      }
    }
  }

  @action.bound public markRiverBanks() {
    const isRiverBank = (cell: Cell) => {
      if (cell.isRiver) {
        return false;
      }
      let result = false;
      this.getCellNeighbors4(cell).forEach(n => {
        if (n && n.isRiver) {
          result = true;
        }
      });
      return result;
    };

    const expectedSegmentLength = Math.round(this.config.riverBankSegmentLength / this.config.cellSize);
    const riverBankSegments: Cell[][] = [];
    const queue = [];

    for (const cell of this.edgeCells) {
      if (isRiverBank(cell)) {
        cell.isRiverBank = true;
        const segment = [cell];
        riverBankSegments.push(segment);
        cell.riverBankSegmentIdx = riverBankSegments.length - 1;
        queue.push(cell);
      }
    }

    while (queue.length > 0) {
      const cell = queue.shift() as Cell;
      const neighbors = this.getCellNeighbors8(cell);
      let foundNeigh = false;
      for (const n of neighbors) {
        // A few conditions here:
        // - follow just one neighbor, don't add more than one to the queue. It ensures that segments don't have forks.
        // - check if shoreIdx properties are equal. It ensures that one segment won't cross the river.
        if (!foundNeigh && n && !n.isRiverBank && n.shoreIdx === cell.shoreIdx && !n.isRiver && isRiverBank(n)) {
          foundNeigh = true;
          queue.push(n);
          n.isRiverBank = true;
          // Divide river banks into segments. Note that new segments are created by splitting the previous one into
          // two pieces. Why? Otherwise, we would end up with some very short segments when two segments approach
          // each other from two different directions. Creating too long segments and dividing them into two ensures
          // that segments will be always as long as we expect, and sometimes they can be even longer (what looks
          // better than too short ones).
          const prevSegment = riverBankSegments[cell.riverBankSegmentIdx];
          // * 2 ensures that we'll split a segment only when we can create two new ones that will have length
          // close to the desired segment length.
          if (prevSegment.length < expectedSegmentLength * 2) {
            prevSegment.push(n);
            n.riverBankSegmentIdx = cell.riverBankSegmentIdx;
          } else {
            const newSegment = prevSegment.slice(expectedSegmentLength);
            newSegment.push(n);
            riverBankSegments.push(newSegment);
            newSegment.forEach(c => { c.riverBankSegmentIdx = riverBankSegments.length - 1; });
            // Limit length of the previous segment.
            prevSegment.length = Math.min(expectedSegmentLength, prevSegment.length);
          }
        }
      }
    }
    // Update observable property.
    this.riverBankSegments = riverBankSegments;
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
    this.setInitialRiverStage(RiverStage.Medium);
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
    this.setInitialRiverStage(this.initialRiverStage); // to update cells
    this.time = 0;
    this.engine = new FloodingEngine(this.cells, this.config);
    this.updateCellsSimulationStateFlag();
    this.emit("restart"); // used by graphs
  }

  @action.bound public reload() {
    this.setDefaultInputs();
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
            // this._riverStage += this.currentRiverWaterIncrement * this.config.riverStageIncreaseSpeed;
          this.engine.riverWaterIncrement = this.currentRiverWaterIncrement;
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
    // Update observable gaugeReading array, so cross-section view can re-render itself.
    this.updateGaugeReadings();
  }

  @action.bound public updateCellsBaseStateFlag() {
    this.cellsBaseStateFlag += 1;
  }

  @action.bound public updateCellsSimulationStateFlag() {
    this.cellsSimulationStateFlag += 1;
  }
}
