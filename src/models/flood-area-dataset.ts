import { action, observable } from "mobx";

export interface ISimulationModel {
  on: (event: "hourChange" | "restart", callback: () => void) => void;
  timeInHours: number;
  floodArea: number;
}

const SQ_M_TO_ACRES = 1 /4047;

export class FloodAreaDataset {
  @observable public points: {x: number, y: number}[];
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

  @action.bound public onHourChange() {
    this.points = this.points.concat(this.getCurrentPoint());
  }

  @action.bound public reset() {
    this.points = [];
  }
}
