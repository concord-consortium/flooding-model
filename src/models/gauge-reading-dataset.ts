export interface ISimulationModel {
  on: (event: "hourChange" | "restart", callback: () => void) => void;
  timeInHours: number;
  getRiverDepth: (gaugeIdx: number) => number;
  crossSections: any[];
}

export const M_TO_FEET = 3.281;

export class GaugeReadingDataset {
  public points: {x: number, y: number}[][];
  private simulation: ISimulationModel;

  constructor(simulation: ISimulationModel) {
    this.simulation = simulation;
    simulation.on("hourChange", this.onHourChange);
    simulation.on("restart", this.reset);
    this.reset();
  }

  public getCurrentPoints(gaugeIdx: number) {
    // Note that .points array can contain more points than timeInHours value, as user can change current time using
    // time slider. In this case all the points stay untouched, we just return different array slice.
    return this.points[gaugeIdx].slice(0, this.simulation.timeInHours + 1);
  }

  public getCurrentPoint(gaugeIdx: number) {
    // Convert area in sq meters to acres.
    return { x: this.simulation.timeInHours / 24, y: this.simulation.getRiverDepth(gaugeIdx) * M_TO_FEET };
  }

  public onHourChange = () => {
    const timeInHours = this.simulation.timeInHours;
    this.simulation.crossSections.forEach((g, idx) => {
      this.points[idx][timeInHours] = this.getCurrentPoint(idx);
    });
  }

  public reset = () => {
    this.points = this.simulation.crossSections.map((g, idx) => []);
  }
}
