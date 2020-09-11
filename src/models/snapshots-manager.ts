import { action, observable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";

export const SNAPSHOT_INTERVAL = 12; // h

export interface ISnapshot {
  simulationSnapshot: ISimulationSnapshot
}

export class SnapshotsManager {
  public snapshots: ISnapshot[] = [];
  @observable public maxDay = 0;

  private simulation: SimulationModel;

  constructor(simulation: SimulationModel) {
    this.simulation = simulation;
    simulation.on("hourChange", this.onHourChange);
    simulation.on("restart", this.reset);
    simulation.on("start", this.start);
    this.reset();
  }

  @action.bound public onHourChange() {
    if (this.simulation.timeInHours % SNAPSHOT_INTERVAL === 0) {
      this.maxDay = this.simulation.timeInHours / 24;
      const arrayIndex = this.simulation.timeInHours / SNAPSHOT_INTERVAL;
      this.snapshots[arrayIndex] = {
        simulationSnapshot: this.simulation.snapshot()
      };
    }
  }

  public restoreSnapshot(day: number) {
    const arrayIndex = day * 24 / SNAPSHOT_INTERVAL;
    const snapshot = this.snapshots[arrayIndex];
    if (!snapshot) {
      return;
    }
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot.simulationSnapshot);
  }

  @action.bound public reset() {
    this.snapshots = [];
    this.maxDay = 0;
  }

  @action.bound public start() {
    const arrayIndex = Math.floor(this.simulation.timeInHours / SNAPSHOT_INTERVAL);
    this.snapshots.length = arrayIndex + 1;
    this.maxDay = this.simulation.timeInHours / 24;
  }
}
