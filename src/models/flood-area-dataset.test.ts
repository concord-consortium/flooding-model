import { FloodAreaDataset, ISimulationModel } from "./flood-area-dataset";

interface ISimMock extends ISimulationModel {
  handlers: {[key: string]: () => void};
}

const getSimulation: () => ISimMock = () => {
  return {
    handlers: {},
    on(event: string, callback: () => void) {
      this.handlers[event] = callback;
    },
    timeInHours: 0,
    floodArea: 0
  };
};

describe("FloodAreaDataset", () => {
  it("starts empty", () => {
    const sim = getSimulation();
    const dataset = new FloodAreaDataset(sim);

    expect(dataset.points).toEqual([]);
  });

  it("adds a new point on hour change and clears them on restart", () => {
    const sim = getSimulation();
    const dataset = new FloodAreaDataset(sim);

    sim.handlers.hourChange();
    sim.timeInHours = 1;
    sim.floodArea = 100 * 4047;
    sim.handlers.hourChange();
    sim.timeInHours = 2;
    sim.floodArea = 200 * 4047;
    sim.handlers.hourChange();

    const expPoints = [
      {x: 0, y: 0},
      {x: 1/24, y: 100},
      {x: 2/24, y: 200}
    ];
    expect(dataset.points).toEqual(expPoints);
    expect(dataset.getCurrentPoints()).toEqual(expPoints);

    // When time changes, only getCurrentPoints() should be affected. The main storage shouldn't be changed.
    sim.timeInHours = 1;
    expect(dataset.points).toEqual(expPoints);
    expect(dataset.getCurrentPoints()).toEqual([
      {x: 0, y: 0},
      {x: 1/24, y: 100}
    ]);

    sim.timeInHours = 0;
    sim.handlers.restart();

    expect(dataset.points).toEqual([]);
  });

  describe("getCurrentPoints", () => {
    it("returns slice of the array based on the simulation time", () => {
      const sim = getSimulation();
      const dataset = new FloodAreaDataset(sim);
      dataset.points.push({x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3});

      sim.timeInHours = 0;
      expect(dataset.getCurrentPoints()).toEqual([{x: 1, y: 1}]);

      sim.timeInHours = 1;
      expect(dataset.getCurrentPoints()).toEqual([{x: 1, y: 1}, {x: 2, y: 2}]);

      sim.timeInHours = 2;
      expect(dataset.getCurrentPoints()).toEqual([{x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3}]);
    });
  });
});
