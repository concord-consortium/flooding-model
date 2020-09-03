import { action, observable } from "mobx";
import { ICrossSectionConfig } from "../config";

export interface ISimulationModel {
  on: (event: "hourChange" | "restart", callback: () => void) => void;
  timeInHours: number;
  getRiverDepth: (gaugeIdx: number) => number;
  crossSections: ICrossSectionConfig[];
}

const M_TO_FEET = 3.281;

export class GaugeReadingDataset {
  @observable public points: {x: number, y: number}[][];
  private simulation: ISimulationModel;

  constructor(simulation: ISimulationModel) {
    this.simulation = simulation;
    simulation.on("hourChange", this.onHourChange);
    simulation.on("restart", this.reset);
    this.reset();
  }

  public getCurrentPoint(gaugeIdx: number) {
    // Convert area in sq meters to acres.
    return { x: this.simulation.timeInHours / 24, y: this.simulation.getRiverDepth(gaugeIdx) * M_TO_FEET };
  }

  @action.bound public onHourChange() {
    this.simulation.crossSections.forEach((g, idx) => {
      this.points[idx] = this.points[idx].concat(this.getCurrentPoint(idx));
    });
  }

  @action.bound public reset() {
    this.points = this.simulation.crossSections.map((g, idx) => []);
  }
}
