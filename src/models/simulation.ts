import { action, computed, observable } from "mobx";
import { Cell, CellOptions } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { getElevationData, getRiverData } from "./utils/data-loaders";
import { getGridIndexForLocation } from "./utils/grid-utils";
import { FloodingEngine } from "./engine/flooding-engine";

// This class is responsible for data loading and general setup. It's more focused
// on management and interactions handling. Core calculations are delegated to FloodingEngine.
// Also, all the observable properties should be here, so the view code can observe them.
export class SimulationModel {
  public config: ISimulationConfig;
  public prevTickTime: number | null;
  public dataReadyPromise: Promise<void>;
  public engine: FloodingEngine | null = null;
  // Cells are not directly observable. Changes are broadcasted using cellsStateFlag and cellsElevationFlag.
  public cells: Cell[] = [];
  @observable public time = 0;
  @observable public dataReady = false;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;
  @observable public minRiverElevation = 0;
  @observable public maxElevation = 0;
  @observable public waterLevel = 0;
  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsStateFlag = 0;
  @observable public cellsElevationFlag = 0;

  constructor(presetConfig: Partial<ISimulationConfig>) {
    this.load(presetConfig);
    // this.dataReadyPromise.then(() => { this.start(); })
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
    return Math.floor(this.time / 60);
  }

  public cellAt(x: number, y: number) {
    const gridX = Math.floor(x / this.config.cellSize);
    const gridY = Math.floor(y / this.config.cellSize);
    return this.cells[getGridIndexForLocation(gridX, gridY, this.config.gridWidth)];
  }

  @action.bound public load(presetConfig: Partial<ISimulationConfig>) {
    this.restart();
    // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
    // by URL parameters.
    this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
    this.populateCellsData();
  }

  @action.bound public populateCellsData() {
    this.dataReady = false;
    const config = this.config;
    this.minRiverElevation = Infinity;
    this.maxElevation = 0;
    this.dataReadyPromise = Promise.all([
      getElevationData(config), getRiverData(config)
    ]).then(values => {
      const elevation = values[0];
      const river = values[1];
      const verticalTilt = (this.config.elevationVerticalTilt / 100) * this.config.heightmapMaxElevation;

      this.cells.length = 0;

      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const index = getGridIndexForLocation(x, y, this.gridWidth);
          const isRiver = river && river[index] > 0;
          // When fillTerrainEdge is set to true, edges are set to elevation 0.
          const isEdge = config.fillTerrainEdges &&
            (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight - 1);
          let baseElevation = isEdge ? 0 : elevation && elevation[index];
          if (verticalTilt && baseElevation !== undefined) {
            const vertProgress = y / this.gridHeight;
            baseElevation += Math.abs(verticalTilt) * (verticalTilt > 0 ? vertProgress : 1 - vertProgress);
          }
          const cellOptions: CellOptions = {
            x, y,
            isEdge,
            isRiver,
            baseElevation,
          };
          if (isRiver && !isEdge && baseElevation && baseElevation < this.minRiverElevation) {
            this.minRiverElevation = baseElevation;
          }
          if (baseElevation && baseElevation > this.maxElevation) {
            this.maxElevation = baseElevation;
          }
          this.cells.push(new Cell(cellOptions, this.config.riverDepth));
        }
      }
      this.waterLevel = this.minRiverElevation;
      this.updateCellsElevationFlag();
      this.updateCellsStateFlag();
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
    if (!this.engine) {
      this.engine = new FloodingEngine(this.cells, this.config);
    }

    this.simulationRunning = true;
    this.prevTickTime = null;

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
    this.updateCellsElevationFlag();
    this.time = 0;
    this.engine = null;
  }

  @action.bound public reload() {
    this.restart();
    this.populateCellsData();
  }

  @action.bound public rafCallback(time: number) {
    if (!this.simulationRunning) {
      return;
    }
    requestAnimationFrame(this.rafCallback);

    let realTimeDiffInMinutes = null;
    if (!this.prevTickTime) {
      this.prevTickTime = time;
    } else {
      realTimeDiffInMinutes = (time - this.prevTickTime) / 60000;
      this.prevTickTime = time;
    }
    let timeStep;
    if (realTimeDiffInMinutes) {
      // One day in model time (86400 seconds) should last X seconds in real time.
      const ratio = 86400 / this.config.modelDayInSeconds;
      // Optimal time step assumes we have stable 60 FPS:
      // realTime = 1000ms / 60 = 16.666ms
      // timeStepInMs = ratio * realTime
      // timeStepInMinutes = timeStepInMs / 1000 / 60
      // Below, these calculations are just simplified (1000 / 60 / 1000 / 60 = 0.000277):
      const optimalTimeStep = ratio * 0.000277;
      // Final time step should be limited by:
      // - maxTimeStep that model can handle
      // - reasonable multiplication of the "optimal time step" so user doesn't see significant jumps in the simulation
      //   when one tick takes much longer time (e.g. when cell properties are recalculated after adding fire line)
      timeStep = Math.min(this.config.maxTimeStep, optimalTimeStep * 4, ratio * realTimeDiffInMinutes);
    } else {
      // We don't know performance yet, so simply increase time by some safe value and wait for the next tick.
      timeStep = 1;
    }

    if (this.engine) {
      this.time += timeStep;
      this.engine.update();
      if (this.engine.simulationDidStop) {
        this.simulationRunning = false;
      }
    }

    this.updateCellsStateFlag();
    if (this.config.renderWaterLevel) {
      this.updateCellsElevationFlag();
    }
  }

  @action.bound public updateCellsElevationFlag() {
    this.cellsElevationFlag += 1;
  }

  @action.bound public updateCellsStateFlag() {
    this.cellsStateFlag += 1;
  }
}
