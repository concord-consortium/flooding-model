import { ISimulationConfig } from "./config";

const getSilverCityPreset = (time: "present" | "past" | "future") => {
  const timeSpecificMapPrefix = `data/${time}-maps/${time}`;

  return {
    elevation: `${timeSpecificMapPrefix}_map_07_heightmap_MODIFIED.png`,
    riverData: `${timeSpecificMapPrefix}_map_riverdata.png`,
    permeability: `${timeSpecificMapPrefix}_map_permeability_map.png`,
    topoTexture: `${timeSpecificMapPrefix}_map_06b_topographic.png`,
    streetTexture: `${timeSpecificMapPrefix}_map_06a_street.png`,
    permeabilityTexture: `${timeSpecificMapPrefix}_map_04_permeability_overlay_COMBINED_WITH_STREET.png`,
    scaleImg: `${timeSpecificMapPrefix}_map_01_scale.png`,
    placeLabelsImg: `${timeSpecificMapPrefix}_map_02_place_labels_COMBINED_WITH_HIGHWAYS.png`,
    pointsOfInterestImg: `${timeSpecificMapPrefix}_map_03_point_of_interest_labels.png`,
    minElevation: 170, // m
    maxElevation: 250, // m
    modelHeight: 8000, // m
    modelWidth: 8000, // m
    view3dElevationMult: 3, // elevation differences are relatively small, so make them more pronounced in 3d rendering
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
        },
        marker: {
          img: "data/model2_marker1.png",
          highlightImg: "data/model2_marker1_highlight.png",
          anchorX: 0.6,
          anchorY: 0.35
        }
      },
      {
        minRiverDepth: 0.5, // m
        maxRiverDepth: 4,
        maxFloodDepth: 8.5,
        riverGauge: {
          x: 44 / 300,
          y: 132 / 300
        },
        rightLevee: {
          x: 44 / 300,
          y: 131 / 300
        },
        leftLevee: {
          x: 44 / 300,
          y: 134 / 300
        },
        rightLandGauge: {
          x: 44 / 300,
          y: 130 / 300
        },
        leftLandGauge: {
          x: 44 / 300,
          y: 135 / 300
        },
        marker: {
          img: "data/model2_marker2.png",
          highlightImg: "data/model2_marker2_highlight.png",
          anchorX: 0.5,
          anchorY: 0.27,
          scale: 1.3
        }
      },
      {
        minRiverDepth: 0.5, // m
        maxRiverDepth: 4,
        maxFloodDepth: 10.2,
        riverGauge: {
          x: 184 / 300,
          y: 63 / 300
        },
        rightLevee: {
          x: 186 / 300,
          y: 63 / 300
        },
        rightLandGauge: {
          x: 187 / 300,
          y: 63 / 300
        },
        leftLevee: {
          x: 182 / 300,
          y: 63 / 300
        },
        leftLandGauge: {
          x: 181 / 300,
          y: 63 / 300
        },
        marker: {
          img: "data/model2_marker3.png",
          highlightImg: "data/model2_marker3_highlight.png",
          anchorX: 0.63,
          anchorY: 0.3
        }
      }
    ]
  };
};

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  // Main models:
  present: getSilverCityPreset("present"),
  past: getSilverCityPreset("past"),
  future: getSilverCityPreset("future"),
  // Test models:
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
    view3d: true,
    timeStep: 0.125
  },
  waterfall: {
    elevation: "data/waterfall_elevation.png",
    waterDepth: "data/waterfall_water.png",
    waterHeightmapMaxDepth: 20,
    minElevation: 0, // m
    maxElevation: 30, // m
    modelHeight: 100, // m
    modelWidth: 100, // m
    view3d: true,
    timeStep: 0.5
  }
};

export default presets;
