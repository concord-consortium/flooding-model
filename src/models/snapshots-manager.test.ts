import { SimulationModel } from "./simulation";
import { SnapshotsManager } from "./snapshots-manager";

const getSimpleSimulation = async () => {
  const s = new SimulationModel({
    elevation: [[0]],
    riverData: null,
    gridWidth: 1
  });
  await s.dataReadyPromise;
  return s;
};

describe("SnapshotsManager", () => {
  it("saves snapshot each 6 hours", async () => {
    const sim = await getSimpleSimulation();
    const snapManager = new SnapshotsManager(sim);
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(0);

    while (sim.timeInHours < 5) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(1);
    while (sim.timeInHours < 6) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(0.25);
    expect(snapManager.snapshots.length).toEqual(2);
    while (sim.timeInHours < 24) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(1);
    expect(snapManager.snapshots.length).toEqual(5);
  });

  it("restores snapshot correctly", async () => {
    const sim = await getSimpleSimulation();
    const snapManager = new SnapshotsManager(sim);
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(0);

    while (sim.timeInHours < 24) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(1);
    expect(snapManager.snapshots.length).toEqual(5);

    const restoreSpy = jest.spyOn(sim, "restoreSnapshot");
    const stopSpy = jest.spyOn(sim, "stop");
    snapManager.restoreSnapshot(0.5);
    expect(restoreSpy).toHaveBeenCalledWith(snapManager.snapshots[2].simulationSnapshot);
    expect(stopSpy).toHaveBeenCalled();
  });

  it("handles simulation restart", async () => {
    const sim = await getSimpleSimulation();
    const snapManager = new SnapshotsManager(sim);
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(0);

    while (sim.timeInHours < 24) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(1);
    expect(snapManager.snapshots.length).toEqual(5);

    sim.restart();
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(0);
  });

  it("handles simulation start", async () => {
    const sim = await getSimpleSimulation();
    const snapManager = new SnapshotsManager(sim);
    expect(snapManager.maxDay).toEqual(0);
    expect(snapManager.snapshots.length).toEqual(0);

    while (sim.timeInHours < 24) {
      sim.tick();
    }
    expect(snapManager.maxDay).toEqual(1);
    expect(snapManager.snapshots.length).toEqual(5);

    snapManager.restoreSnapshot(0.5);
    expect(snapManager.maxDay).toEqual(1);
    expect(snapManager.snapshots.length).toEqual(5);

    sim.start();
    // Clear all the data that is after current point in time once simulation is started again.
    expect(snapManager.maxDay).toEqual(0.5);
    expect(snapManager.snapshots.length).toEqual(3);
  });
});
