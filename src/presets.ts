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
    modelWidth: 8000, // m
    crossSections: [
      {
        minRiverDepth: 0.5, // m
        maxRiverDepth: 4,
        maxFloodDepth: 9,
        riverGauge: {
          x: 187 / 300,
          y: 223 / 300
        },
        leftLevee: {
         x: 185 / 300,
         y: 223 / 300
        },
        rightLevee: {
          x: 188 / 300,
          y: 224 / 300
        },
        leftLandGauge: {
          x: 182 / 300,
          y: 223 / 300
        },
        rightLandGauge: {
          x: 190 / 300,
          y: 225 / 300
        }
      },
      // {
      //   minRiverDepth: 0.5, // m
      //   maxRiverDepth: 4,
      //   maxFloodDepth: 10,
      //   riverGauge: {
      //     x: 0.153,
      //     y: 0.44
      //   }
      // },
      // {
      //   minRiverDepth: 0.5, // m
      //   maxRiverDepth: 4,
      //   maxFloodDepth: 10,
      //   riverGauge: {
      //     x: 0.603,
      //     y: 0.26
      //   }
      // }
    ]
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
