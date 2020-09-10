export interface ISimulationModel {
  on: (event: "hourChange" | "restart", callback: () => void) => void;
  timeInHours: number;
  floodArea: number;
}

const SQ_M_TO_ACRES = 1 / 4047;

export class FloodAreaDataset {
  public points: {x: number, y: number}[];
  private simulation: ISimulationModel;

  constructor(simulation: ISimulationModel) {
    this.simulation = simulation;
    simulation.on("hourChange", this.onHourChange);
    simulation.on("restart", this.reset);
    this.reset();
  }

  public getCurrentPoint() {
    // Convert area in sq meters to acres.
    return { x: this.simulation.timeInHours / 24, y: this.simulation.floodArea * SQ_M_TO_ACRES };
  }

  public onHourChange = () => {
    const timeInHours = this.simulation.timeInHours;
    this.points[timeInHours] = this.getCurrentPoint();
  }

  public reset = () => {
    this.points = [];
  }
}
