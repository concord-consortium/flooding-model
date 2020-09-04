import { RainIntensity, RiverStage, SimulationModel } from "./simulation";
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

    expect(s.cellsBaseStateFlag).toBeGreaterThan(0);
    expect(s.cellsSimulationStateFlag).toBeGreaterThan(0);

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

      expect(s.cellAt(0, 0)?.x).toEqual(0);
      expect(s.cellAt(0, 0)?.y).toEqual(0);

      expect(s.cellAt(25, 0)?.x).toEqual(1); // x = 25m => grid x = 1
      expect(s.cellAt(25, 0)?.y).toEqual(0);

      expect(s.cellAt(95, 60)?.x).toEqual(4); // x = 95m => grid x = 4
      expect(s.cellAt(25, 60)?.y).toEqual(3); // y = 60m => grid y = 3
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
      s.setRainDurationInDays(4);
      s.setRainIntensity(123);
      s.setInitialWaterSaturation(123);

      s.restart();
      expect(s.simulationRunning).toEqual(false);
      expect(s.simulationStarted).toEqual(false);
      expect(s.cells[0].reset).toHaveBeenCalled();
      expect(s.time).toEqual(0);
      expect(s.rainDurationInDays).toEqual(4);
      expect(s.rainIntensity).toEqual(123);
      expect(s.initialWaterSaturation).toEqual(123);
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
      s.setRainDurationInDays(123);
      s.setRainIntensity(123);
      s.setInitialWaterSaturation(123);

      s.reload();
      expect(s.simulationRunning).toEqual(false);
      expect(s.simulationStarted).toEqual(false);
      expect(s.cells[0].reset).toHaveBeenCalled();
      expect(s.time).toEqual(0);
      expect(s.rainDurationInDays).toEqual(2);
      expect(s.rainIntensity).toEqual(RainIntensity.Medium);
      expect(s.initialWaterSaturation).toEqual(RiverStage.Medium);
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

      const oldCellStateFlag = s.cellsSimulationStateFlag;

      s.simulationRunning = false;
      s.rafCallback();
      // should do nothing unless model is started (so model can actually stop that way).
      expect(rafMock).not.toHaveBeenCalled();
      expect(s.cellsSimulationStateFlag).toEqual(oldCellStateFlag);

      s.simulationRunning = true;
      s.rafCallback();
      // should do nothing unless model is started.
      expect(rafMock).toHaveBeenCalled();
      expect(floodingEngineUpdateMock).toHaveBeenCalledTimes(speedMult);
      expect(s.cellsSimulationStateFlag).toEqual(oldCellStateFlag + 1);
    });

    it("updates river stage and engine.waterSaturationIncrement based on river stage value", async () => {
      const s = new SimulationModel({
        elevation: [[0]],
        riverData: null,
        gridWidth: 1,
        rainStartDay: 0 // to keep the test simpler
      });
      await s.dataReadyPromise;

      s.simulationRunning = true;
      s.rafCallback();
      expect(s.engine?.waterSaturationIncrement).toBeGreaterThan(0);
    });
  });

  describe("weather", () => {
    it("is based on current day", async () => {
      const s = await getSimpleSimulation();
      expect(s.weather).toEqual("partlyCloudy");
      s.time = s.config.rainStartDay / s.config.modelTimeToHours * 24;
      expect(s.weather).toEqual("mediumRain");
      s.time = (s.config.rainStartDay + s.rainDurationInDays) / s.config.modelTimeToHours * 24;
      expect(s.weather).toEqual("sunny");
    });
  });

  describe("updateCellsBaseStateFlag", () => {
    it("increases cellsBaseStateFlag", async () => {
      const s = await getSimpleSimulation();

      const oldCellsBaseElevationFlag = s.cellsBaseStateFlag;
      s.updateCellsBaseStateFlag();
      expect(s.cellsBaseStateFlag).toEqual(oldCellsBaseElevationFlag + 1);
    });
  });

  describe("updateCellsSimulationStateFlag", () => {
    it("increases cellsSimulationStateFlag", async () => {
      const s = await getSimpleSimulation();

      const oldcellsSimulationStateFlag = s.cellsSimulationStateFlag;
      s.updateCellsSimulationStateFlag();
      expect(s.cellsSimulationStateFlag).toEqual(oldcellsSimulationStateFlag + 1);
    });
  });
});
