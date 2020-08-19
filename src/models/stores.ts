import { SimulationModel } from "./simulation";
import { FloodAreaDataset } from "./flood-area-dataset";
import { UIModel } from "./ui";
import presets from "../presets";
import { getDefaultConfig, getUrlConfig } from "../config";
import { GaugeReadingDataset } from "./gauge-reading-dataset";

export interface IStores {
  simulation: SimulationModel;
  ui: UIModel;
  floodAreaDataset: FloodAreaDataset;
  gaugeReadingDataset: GaugeReadingDataset;
}

export const createStores = (): IStores => {
  // Export some variables and types to window. This lets authors open browser console and load preset manually like:
  // sim.load({
  //   modelWidth: 120000,
  //   modelHeight: 80000,
  //   ...
  // })
  const simulation = new SimulationModel(presets[getUrlConfig().preset || getDefaultConfig().preset]);
  (window as any).sim = simulation;
  return {
    simulation,
    ui: new UIModel(),
    floodAreaDataset: new FloodAreaDataset(simulation),
    gaugeReadingDataset: new GaugeReadingDataset(simulation)
  };
};
