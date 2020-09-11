import { SimulationModel } from "./simulation";
import presets from "../presets";
import { Cell } from "./cell";

// Custom matcher, pretty much the same as .toBeEqual but with a custom error message.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeEqualProperty(propName: string, value: any): CustomMatcherResult
    }
  }
}

expect.extend({
  toBeEqualProperty(received, propName, value) {
    if (received === value) {
      return {
        message: () => `${propName}: ${received} should NOT be equal to ${value}`,
        pass: true
      };
    } else {
      return {
        message: () => `${propName}: ${received} should be equal to ${value}`,
        pass: false
      };
    }
  }
});


// This affects test performance.
const GRID_WIDTH = 30;

const getSimulation = async () => {
  const config = presets.slope;
  config.gridWidth = GRID_WIDTH; // speed up tests
  const s = new SimulationModel(config);
  await s.dataReadyPromise;
  return s;
};

const compareCells = (cell1: Cell, cell2: Cell) => {
  Object.keys(cell2).forEach(prop => {
    expect((cell2 as any)[prop]).toBeEqualProperty(prop, (cell1 as any)[prop]);
  });
};

const compareModels = (sim1: SimulationModel, sim2: SimulationModel) => {
  expect(sim2.time).toEqual(sim1.time);
  sim2.cells.forEach((cell, idx) => {
    compareCells(cell, sim1.cells[idx]);
  });
};

// These tests should automatically detect that some property isn't serialized even though it should be.
// For example you can try to remove .fluxR from Cell snapshot() method. Test below should fail.
// It creates two identical models, runs them for a bit, creates snapshots, runs them again, restores snapshots
// and runs them again till they reach test time. That way we can compare if restoring snapshot didn't affect
// any calculations.
describe("Simulation serialization", () => {
  it("serializes all the necessary properties to ensure that models can be restored in 100% complete way", async () => {
    const sim1 = await getSimulation();
    const sim2 = await getSimulation();

    const snapshot1Time = 24;
    const snapshot2Time = 48;
    const testTime = 5 * 24;

    // Save two snaoshots.
    while (sim1.timeInHours < snapshot1Time) {
      sim1.tick();
    }
    const sim1Snapshot = sim1.snapshot();
    while (sim1.timeInHours < testTime) {
      sim1.tick();
    }

    while (sim2.timeInHours < snapshot2Time) {
      sim2.tick();
    }
    const sim2Snapshot = sim2.snapshot();
    while (sim2.timeInHours < testTime) {
      sim2.tick();
    }

    // Compare models, they should be identical.
    compareModels(sim1, sim2);

    // Restore sim1 and then calculate progress again.
    sim1.restoreSnapshot(sim1Snapshot);
    expect(sim1.timeInHours).toEqual(snapshot1Time);
    while (sim1.timeInHours < testTime) {
      sim1.tick();
    }
    // Compare models, they should be identical again.
    compareModels(sim1, sim2);


    // Restore sim2 and then calculate progress again.
    sim2.restoreSnapshot(sim2Snapshot);
    expect(sim2.timeInHours).toEqual(snapshot2Time);
    while (sim2.timeInHours < testTime) {
      sim2.tick();
    }
    // Compare models, they should be identical again.
    compareModels(sim1, sim2);
  });
});
