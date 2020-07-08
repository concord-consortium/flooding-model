import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  RiverCity: {
    elevation: "data/model2_heightmap_hi.png",
    riverData: "data/model2_map_riverdata.png",
    texture: "data/model2_map_topo.png",
    waterIncrement: 0.1,
    minElevation: 170, // m
    maxElevation: 250, // m
    modelHeight: 8000, // m
    modelWidth: 8000 // m
  },
  // Test preset. It should behave exactly the same as RiverCity.
  RiverCityScaled: {
    elevation: "data/model2_heightmap_hi.png",
    riverData: "data/model2_map_riverdata.png",
    texture: "data/model2_map_topo.png",
    waterIncrement: 0.01,
    minElevation: 17, // m
    maxElevation: 25, // m
    modelHeight: 800, // m
    modelWidth: 800 // m
  }
};

export default presets;
