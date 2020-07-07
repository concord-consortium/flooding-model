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
  public dataReadyPromise: Promise<void>;
  public engine: FloodingEngine | null = null;
  // Cells are not directly observable. Changes are broadcasted using cellsStateFlag and cellsBaseElevationFlag.
  public cells: Cell[] = [];
  @observable public time = 0;
  @observable public dataReady = false;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;
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
          this.cells.push(new Cell(cellOptions));
        }
      }
      this.updateCellsBaseElevationFlag();
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
    this.engine = null;
  }

  @action.bound public reload() {
    this.restart();
    this.populateCellsData();
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
