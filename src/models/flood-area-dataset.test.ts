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
  it("starts with 0,0 point", () => {
    const sim = getSimulation();
    const dataset = new FloodAreaDataset(sim);

    expect(dataset.points[0]).toEqual({x: 0, y: 0});
  });

  it("adds a new point on hour change and leaves just one on restart", () => {
    const sim = getSimulation();
    const dataset = new FloodAreaDataset(sim);

    sim.timeInHours = 24;
    sim.floodArea = 100 * 4047;
    sim.handlers.hourChange();
    sim.timeInHours = 48;
    sim.floodArea = 200 * 4047;
    sim.handlers.hourChange();

    expect(dataset.points).toEqual([
      {x: 0, y: 0},
      {x: 1, y: 100},
      {x: 2, y: 200}
    ]);

    sim.timeInHours = 0;
    sim.floodArea = 10 * 4047;
    sim.handlers.restart();

    expect(dataset.points).toEqual([
      {x: 0, y: 10}
    ]);
  });
});
