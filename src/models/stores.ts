import { SimulationModel } from "./simulation";
import { UIModel } from "./ui";
import presets from "../presets";
import { getDefaultConfig, getUrlConfig } from "../config";

export interface IStores {
  simulation: SimulationModel;
  ui: UIModel;
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
    ui: new UIModel()
  };
};
