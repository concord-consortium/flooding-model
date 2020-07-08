import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  RiverCity: {
    elevation: "data/model2_heightmap_hi.png",
    riverData: "data/model2_map_riverdata.png",
    texture: "data/model2_map_topo.png",
    minElevation: 170, // m
    maxElevation: 250, // m
    modelHeight: 8000, // m
    modelWidth: 8000 // m
  }
};

export default presets;
