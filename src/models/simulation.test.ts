import { RainIntensity, SimulationModel } from "./simulation";
import { FloodingEngine } from "./engine/flooding-engine";

const rafMock = jest.fn();
(window as any).requestAnimationFrame = rafMock;

const floodingEngineUpdateMock = jest.fn();
jest.mock("./engine/flooding-engine", () => ({
  FloodingEngine: function FloodingEngineMock() {
    this.update = floodingEngineUpdateMock;
  }
}));

const getSimpleSimulation = async () => {
  const s = new SimulationModel({
    elevation: [[0]],
    riverData: null,
    gridWidth: 1
  });
  await s.dataReadyPromise;
  return s;
};

describe("SimulationModel", () => {
  beforeEach(() => {
    rafMock.mockClear();
  });

  it("generates cell after being initialized and updates observable flags", async () => {
    const s = new SimulationModel({
      elevation: [[ 0 ]],
      riverData: [[ 0, 0, 1, 0, 0 ]],
      gridWidth: 5
    });
    await s.dataReadyPromise;
    expect(s.cells.length).toEqual(25);
    expect(s.cells.filter(c => c.isRiver).length).toEqual(5);
    expect(s.cells.filter(c => c.isEdge).length).toEqual(16);

    expect(s.cellsBaseElevationFlag).toBeGreaterThan(0);
    expect(s.cellsStateFlag).toBeGreaterThan(1);

    expect(s.ready).toEqual(true);

    expect(s.engine).toBeInstanceOf(FloodingEngine);
  });

  describe("cellAt", () => {
    it("returns correct cell", async () => {
      const s = new SimulationModel({
        elevation: [[0]],
        riverData: null,
        gridWidth: 5,
        modelWidth: 100, // m
        modelHeight: 100 // m
      });
      await s.dataReadyPromise;

      expect(s.cellAt(0, 0).x).toEqual(0);
      expect(s.cellAt(0, 0).y).toEqual(0);

      expect(s.cellAt(25, 0).x).toEqual(1); // x = 25m => grid x = 1
      expect(s.cellAt(25, 0).y).toEqual(0);

      expect(s.cellAt(95, 60).x).toEqual(4); // x = 95m => grid x = 4
      expect(s.cellAt(25, 60).y).toEqual(3); // y = 60m => grid y = 3
    });
  });

  describe("start", () => {
    it("updates some flags, calls requestAnimationFrame", async () => {
      const s = await getSimpleSimulation();

      s.start();
      expect(s.simulationRunning).toEqual(true);
      expect(s.simulationStarted).toEqual(true);
      expect(rafMock).toHaveBeenCalledWith(s.rafCallback);
    });
  });

  describe("stop", () => {
    it("sets simulationRunning to false", async () => {
      const s = await getSimpleSimulation();

      s.start();
      expect(s.simulationRunning).toEqual(true);
      expect(s.simulationStarted).toEqual(true);
      s.stop();
      expect(s.simulationRunning).toEqual(false);
      expect(s.simulationStarted).toEqual(true);
    });
  });

  describe("restart", () => {
    it("resets various model properties, but doesn't affect user settings", async () => {
      const s = await getSimpleSimulation();

      s.start();
      expect(s.simulationRunning).toEqual(true);
      expect(s.simulationStarted).toEqual(true);

      jest.spyOn(s.cells[0], "reset");
      s.time = 123;
      s.rainDurationInDays = 123;
      s.rainIntensity = 123;
      s.initialWaterLevel = 123;

      s.restart();
      expect(s.simulationRunning).toEqual(false);
      expect(s.simulationStarted).toEqual(false);
      expect(s.cells[0].reset).toHaveBeenCalled();
      expect(s.time).toEqual(0);
      expect(s.rainDurationInDays).toEqual(123);
      expect(s.rainIntensity).toEqual(123);
      expect(s.initialWaterLevel).toEqual(123);
    });
  });

  describe("reload", () => {
    it("resets various model properties and user settings", async () => {
      const s = await getSimpleSimulation();

      s.start();
      expect(s.simulationRunning).toEqual(true);
      expect(s.simulationStarted).toEqual(true);

      jest.spyOn(s.cells[0], "reset");
      s.time = 123;
      s.rainDurationInDays = 123;
      s.rainIntensity = 123;
      s.initialWaterLevel = 123;

      s.reload();
      expect(s.simulationRunning).toEqual(false);
      expect(s.simulationStarted).toEqual(false);
      expect(s.cells[0].reset).toHaveBeenCalled();
      expect(s.time).toEqual(0);
      expect(s.rainDurationInDays).toEqual(2);
      expect(s.rainIntensity).toEqual(RainIntensity.Medium);
      expect(s.initialWaterLevel).toEqual(0.5);
    });
  });

  describe("rafCallback", () => {
    it("runs the simulation if the model has been started", async () => {
      const speedMult = 3;
      const s = new SimulationModel({
        elevation: [[0]],
        riverData: null,
        gridWidth: 1,
        speedMult
      });
      await s.dataReadyPromise;

      const oldCellStateFlag = s.cellsStateFlag;

      s.simulationRunning = false;
      s.rafCallback();
      // should do nothing unless model is started (so model can actually stop that way).
      expect(rafMock).not.toHaveBeenCalled();
      expect(s.cellsStateFlag).toEqual(oldCellStateFlag);

      s.simulationRunning = true;
      s.rafCallback();
      // should do nothing unless model is started.
      expect(rafMock).toHaveBeenCalled();
      expect(floodingEngineUpdateMock).toHaveBeenCalledTimes(speedMult);
      expect(s.cellsStateFlag).toEqual(oldCellStateFlag + 1);
    });

    it("updates river stage and engine.riverWaterIncrement based on river stage value", async () => {
      const s = new SimulationModel({
        elevation: [[0]],
        riverData: null,
        gridWidth: 1
      });
      await s.dataReadyPromise;

      s.simulationRunning = true;
      const oldRiverStage = s.riverStage;
      s.rafCallback();
      expect(s.riverStage).toBeGreaterThan(oldRiverStage);
      expect(s.riverStage).toBeLessThan(1);
      expect(s.engine?.riverWaterIncrement).toEqual(0);

      (s as any)._riverStage = 1;
      s.rafCallback();
      expect(s.engine?.riverWaterIncrement).toBeGreaterThan(0);
    });
  });

  describe("updateCellsBaseElevationFlag", () => {
    it("increases cellsBaseElevationFlag", async () => {
      const s = await getSimpleSimulation();

      const oldCellsBaseElevationFlag = s.cellsBaseElevationFlag;
      s.updateCellsBaseElevationFlag();
      expect(s.cellsBaseElevationFlag).toEqual(oldCellsBaseElevationFlag + 1);
    });
  });

  describe("updateCellsStateFlag", () => {
    it("increases cellsStateFlag", async () => {
      const s = await getSimpleSimulation();

      const oldCellsStateFlag = s.cellsStateFlag;
      s.updateCellsStateFlag();
      expect(s.cellsStateFlag).toEqual(oldCellsStateFlag + 1);
    });
  });
});