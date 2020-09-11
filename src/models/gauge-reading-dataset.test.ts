import { GaugeReadingDataset, ISimulationModel, M_TO_FEET } from "./gauge-reading-dataset";

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
    crossSections: [
      {}, {}
    ],
    getRiverDepth: (gaugeIdx: number) => {
      return gaugeIdx;
    }
  };
};

describe("GaugeReadingDataset", () => {
  it("starts empty", () => {
    const sim = getSimulation();
    const dataset = new GaugeReadingDataset(sim);

    expect(dataset.points).toEqual([ [], [] ]);
  });

  it("adds a new point on hour change and clears them on restart", () => {
    const sim = getSimulation();
    const dataset = new GaugeReadingDataset(sim);

    sim.handlers.hourChange();
    sim.timeInHours = 1;
    sim.handlers.hourChange();
    sim.timeInHours = 2;
    sim.handlers.hourChange();

    const expPoints = [
      [
        {x: 0, y: 0},
        {x: 1/24, y: 0},
        {x: 2/24, y: 0}
      ],
      [
        {x: 0, y: M_TO_FEET},
        {x: 1/24, y: M_TO_FEET},
        {x: 2/24, y: M_TO_FEET}
      ],
    ];

    expect(dataset.points).toEqual(expPoints);
    expect(dataset.getCurrentPoints(0)).toEqual(expPoints[0]);
    expect(dataset.getCurrentPoints(1)).toEqual(expPoints[1]);

    // When time changes, only getCurrentPoints() should be affected. The main storage shouldn't be changed.
    sim.timeInHours = 1;
    expect(dataset.points).toEqual(expPoints);
    expect(dataset.getCurrentPoints(0)).toEqual([
      {x: 0, y: 0},
      {x: 1/24, y: 0}
    ]);
    expect(dataset.getCurrentPoints(1)).toEqual([
      {x: 0, y: M_TO_FEET},
      {x: 1/24, y: M_TO_FEET}
    ]);

    sim.timeInHours = 0;
    sim.handlers.restart();

    expect(dataset.points).toEqual([ [], [] ]);
  });
});
