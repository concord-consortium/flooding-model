import { SimulationModel } from "./simulation";
import { RainIntensity, RiverStage } from "../types";
import { FloodingEngine } from "./engine/flooding-engine";
import { log } from "../log";

jest.mock("../log", () => ({
  log: jest.fn()
}));
const logMock = log as jest.Mock;

const rafMock = jest.fn();
(window as any).requestAnimationFrame = rafMock;

const floodingEngineUpdateMock = jest.fn();
jest.mock("./engine/flooding-engine", () => ({
  FloodingEngine: function FloodingEngineMock() {
    this.update = floodingEngineUpdateMock;
  }
}));

const floodingEngineGPUUpdateMock = jest.fn();
jest.mock("./engine/flooding-engine-gpu", () => ({
  FloodingEngineGPU: function FloodingEngineGPUMock() {
    this.update = floodingEngineGPUUpdateMock;
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
    floodingEngineUpdateMock.mockClear();
    floodingEngineGPUUpdateMock.mockClear();
    logMock.mockClear();
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

    it("getOutcomeData is available after stop for SimulationStopped logging", async () => {
      const s = await getSimpleSimulation();
      s.start();
      s.stop();
      const outcome = s.getOutcomeData();
      expect(outcome).toHaveProperty("timeInDays");
      expect(outcome).toHaveProperty("timeInHours");
      expect(outcome).toHaveProperty("floodAreaAcres");
      expect(outcome).toHaveProperty("baselineGaugeReadings");
      expect(outcome).toHaveProperty("finalGaugeReadings");
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
      expect(s.rainDurationInDays).toEqual(s.config.rainDuration);
      expect(s.rainIntensity).toEqual(RainIntensity[s.config.rainIntensity]);
      expect(s.initialWaterSaturation).toEqual(RiverStage[s.config.startingWaterLevel]);
    });
  });

  describe("rafCallback", () => {
    it("runs the simulation if the model has been started", async () => {
      const s = await getSimpleSimulation();

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
    });

    it("stops simulation automatically after 14 days", async () => {
      const s = await getSimpleSimulation();
      s.start();
      s.rafCallback();
      expect(s.simulationRunning).toEqual(true);

      s.time = (1 / s.config.modelTimeToHours) * 24 * s.config.simulationLength;
      s.rafCallback();
      expect(s.simulationRunning).toEqual(false);
    });
  });

  describe("tick", () => {
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
      const oldCrossSectionState = s.crossSectionState;

      s.tick();

      expect(floodingEngineUpdateMock).toHaveBeenCalledTimes(speedMult);
      expect(s.cellsSimulationStateFlag).toEqual(oldCellStateFlag + 1);
      expect(s.crossSectionState).not.toBe(oldCrossSectionState);
    });

    it("updates river stage and engine.waterSaturationIncrement based on river stage value", async () => {
      const s = new SimulationModel({
        elevation: [[0]],
        riverData: null,
        gridWidth: 1,
        rainStartDay: 0 // to keep the test simpler
      });
      await s.dataReadyPromise;

      s.tick();
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

  describe("updateCrossSectionStates", () => {
    it("increases cellsSimulationStateFlag", async () => {
      const s = await getSimpleSimulation();

      const oldCrossSectionState = s.crossSectionState;
      s.updateCrossSectionStates();
      expect(s.cellsSimulationStateFlag).not.toBe(oldCrossSectionState);
    });
  });

  describe("getStartedData", () => {
    it("returns correct parameter labels for all rain intensity values", async () => {
      const s = await getSimpleSimulation();
      s.setRainIntensity(RainIntensity.light);
      expect(s.getStartedData().rainIntensity).toEqual("light");
      s.setRainIntensity(RainIntensity.medium);
      expect(s.getStartedData().rainIntensity).toEqual("medium");
      s.setRainIntensity(RainIntensity.heavy);
      expect(s.getStartedData().rainIntensity).toEqual("heavy");
      s.setRainIntensity(RainIntensity.extreme);
      expect(s.getStartedData().rainIntensity).toEqual("extreme");
    });

    it("returns correct water level labels for all RiverStage values", async () => {
      const s = await getSimpleSimulation();
      s.setInitialWaterSaturation(RiverStage.low);
      expect(s.getStartedData().startingWaterLevel).toEqual("low");
      s.setInitialWaterSaturation(RiverStage.medium);
      expect(s.getStartedData().startingWaterLevel).toEqual("medium");
      s.setInitialWaterSaturation(RiverStage.high);
      expect(s.getStartedData().startingWaterLevel).toEqual("high");
    });

    it("returns expected structure with simulation parameters", async () => {
      const s = await getSimpleSimulation();
      const data = s.getStartedData();
      expect(data).toHaveProperty("rainIntensity");
      expect(data).toHaveProperty("stormDuration");
      expect(data).toHaveProperty("startingWaterLevel");
      expect(data).toHaveProperty("simulationLength");
      expect(data).toHaveProperty("presetName");
      expect(data).toHaveProperty("activeTimePeriod");
      expect(data).toHaveProperty("levees");
      expect(Array.isArray(data.levees)).toBe(true);
    });
  });

  describe("getOutcomeData", () => {
    it("returns expected structure", async () => {
      const s = await getSimpleSimulation();
      s.start();
      const data = s.getOutcomeData();
      expect(data).toHaveProperty("presetName");
      expect(data).toHaveProperty("activeTimePeriod");
      expect(data).toHaveProperty("timeInDays");
      expect(data).toHaveProperty("timeInHours");
      expect(data).toHaveProperty("floodAreaAcres");
      expect(data).toHaveProperty("baselineGaugeReadings");
      expect(data).toHaveProperty("finalGaugeReadings");
      expect(data).toHaveProperty("baselineCrossSections");
      expect(data).toHaveProperty("finalCrossSections");
      expect(data).toHaveProperty("leveeWaterLevels");
    });

    it("returns empty arrays when no cross-sections or levees configured", async () => {
      const s = await getSimpleSimulation();
      s.start();
      const data = s.getOutcomeData();
      expect(data.baselineGaugeReadings).toEqual([]);
      expect(data.finalGaugeReadings).toEqual([]);
      expect(data.leveeWaterLevels).toEqual([]);
    });
  });

  describe("fireSimulationEnded", () => {
    it("logs SimulationEnded with reason and outcome", async () => {
      const s = await getSimpleSimulation();
      s.start();
      s.fireSimulationEnded("ByItself");
      expect(logMock).toHaveBeenCalledWith("SimulationEnded", expect.objectContaining({
        reason: "ByItself",
        outcome: expect.objectContaining({
          timeInDays: expect.any(Number),
          timeInHours: expect.any(Number),
          floodAreaAcres: expect.any(Number)
        })
      }));
    });

    it("guards against double-firing", async () => {
      const s = await getSimpleSimulation();
      s.start();
      s.fireSimulationEnded("ByItself");
      s.fireSimulationEnded("SimulationRestarted");
      const endedCalls = logMock.mock.calls.filter(
        (call: any[]) => call[0] === "SimulationEnded"
      );
      expect(endedCalls).toHaveLength(1);
      expect(endedCalls[0][1].reason).toEqual("ByItself");
    });

    it("resets guard on new run after restart", async () => {
      const s = await getSimpleSimulation();
      s.start();
      s.fireSimulationEnded("ByItself");
      s.restart();
      s.start();
      s.fireSimulationEnded("SimulationRestarted");
      const endedCalls = logMock.mock.calls.filter(
        (call: any[]) => call[0] === "SimulationEnded"
      );
      expect(endedCalls).toHaveLength(2);
      expect(endedCalls[1][1].reason).toEqual("SimulationRestarted");
    });
  });

  describe("baseline snapshot", () => {
    it("captures baseline on start when time is 0", async () => {
      const s = await getSimpleSimulation();
      s.start();
      const outcome = s.getOutcomeData();
      expect(outcome.baselineGaugeReadings).toBeDefined();
      expect(outcome.baselineCrossSections).toBeDefined();
    });

    it("does not overwrite baseline on resume after pause", async () => {
      const s = await getSimpleSimulation();
      s.start();
      const baselineBefore = s.getOutcomeData().baselineGaugeReadings;
      s.stop();
      // Advance time to simulate mid-run
      s.time = 100;
      s.start(); // resume — should NOT recapture baseline
      const baselineAfter = s.getOutcomeData().baselineGaugeReadings;
      expect(baselineAfter).toEqual(baselineBefore);
    });
  });

  describe("rafCallback with SimulationEnded", () => {
    it("fires SimulationEnded with reason ByItself when simulation reaches length", async () => {
      const s = await getSimpleSimulation();
      s.start();
      logMock.mockClear();
      s.time = (1 / s.config.modelTimeToHours) * 24 * s.config.simulationLength;
      s.rafCallback();
      expect(s.simulationRunning).toEqual(false);
      expect(logMock).toHaveBeenCalledWith("SimulationEnded", expect.objectContaining({
        reason: "ByItself"
      }));
    });
  });
});
