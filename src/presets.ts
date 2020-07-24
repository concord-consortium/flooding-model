import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  RiverCity: {
    elevation: "data/model2_map_07_heightmap.png",
    riverData: "data/model2_map_riverdata.png",
    permeability: "data/model2_permeability_map.png",
    permeabilityValues: [0.05, 0.025, 0.007],
    texture: "data/model2_map_06b_topographic.png",
    riverWaterIncrement: 0.1,
    minElevation: 170, // m
    maxElevation: 250, // m
    modelHeight: 8000, // m
    modelWidth: 8000 // m
  },
  // Test preset. It should behave exactly the same as RiverCity.
  RiverCityScaled: {
    elevation: "data/model2_map_07_heightmap.png",
    riverData: "data/model2_map_riverdata.png",
    permeability: "data/model2_permeability_map.png",
    permeabilityValues: [0.005, 0.0025, 0.0007],
    texture: "data/model2_map_06b_topographic.png",
    riverWaterIncrement: 0.01,
    minElevation: 17, // m
    maxElevation: 25, // m
    modelHeight: 800, // m
    modelWidth: 800 // m
  },
  slope: {
    elevation: [
      [3, 4, 5, 4, 3],
      [2, 3, 6, 3, 2],
      [1, 2, 3, 2, 1],
      [0, 1, 2, 1, 0],
      [0, 0, 0, 0, 0]
    ],
    waterDepth: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ],
    minElevation: 0, // m
    maxElevation: 250, // m
    modelHeight: 10, // m
    modelWidth: 10 // m
  },
  waterfall: {
    elevation: "data/waterfall_elevation.png",
    waterDepth: "data/waterfall_water.png",
    waterHeightmapMaxDepth: 20,
    minElevation: 0, // m
    maxElevation: 30, // m
    modelHeight: 100, // m
    modelWidth: 100 // m
  }
};

export default presets;
