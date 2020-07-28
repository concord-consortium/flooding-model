import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  RiverCity: {
    elevation: "data/model2_map_07_heightmap_v2.png",
    riverData: "data/model2_map_riverdata.png",
    permeability: "data/model2_permeability_map.png",
    texture: "data/model2_map_06b_topographic.png",
    minElevation: 170, // m
    maxElevation: 250, // m
    modelHeight: 8000, // m
    modelWidth: 8000 // m
  },
  // Test preset. It should behave exactly the same as RiverCity.
  RiverCityScaled: {
    elevation: "data/model2_map_07_heightmap_v2.png",
    riverData: "data/model2_map_riverdata.png",
    permeability: "data/model2_permeability_map.png",
    texture: "data/model2_map_06b_topographic.png",
    permeabilityValues: [0.002 / 10, 0.001 / 10, 0.0007 / 10],
    rainStrength: [0.0025 / 10, 0.005 / 10, 0.0075 / 10, 0.02 / 10],
    riverStageIncreaseSpeed: 0.125 * 10,
    minElevation: 170 / 10, // m
    maxElevation: 250 / 10, // m
    modelHeight: 8000 / 10, // m
    modelWidth: 8000 / 10 // m
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
    modelWidth: 10, // m
    view3d: true
  },
  waterfall: {
    elevation: "data/waterfall_elevation.png",
    waterDepth: "data/waterfall_water.png",
    waterHeightmapMaxDepth: 20,
    minElevation: 0, // m
    maxElevation: 30, // m
    modelHeight: 100, // m
    modelWidth: 100, // m
    view3d: true
  }
};

export default presets;
