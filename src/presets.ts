import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  iowa: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 45, // lowest point around 195m, highest around 235, 45m diff
    elevationVerticalTilt: 0,
    modelHeight: 13000, // around 13km, measured on google maps
    modelWidth: 20000
  },
  iowaTilt: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 45, // lowest point around 195m, highest around 235, 45m diff
    elevationVerticalTilt: -3,
    modelHeight: 13000, // around 13km, measured on google maps
    modelWidth: 20000
  },
  iowaAmplified1: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 45 * 5, // lowest point around 195m, highest around 235, 45m diff
    elevationVerticalTilt: -3 * 5,
    modelHeight: 13000, // around 13km, measured on google maps
    modelWidth: 20000
  },
  iowaAmplified2: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 45 * 3, // lowest point around 195m, highest around 235, 45m diff
    elevationVerticalTilt: -3 * 3,
    modelHeight: 13000, // around 13km, measured on google maps
    modelWidth: 20000
  },
  iowaAmplified3: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 45 * 20, // lowest point around 195m, highest around 235, 45m diff
    elevationVerticalTilt: -3 * 20,
    modelHeight: 13000, // around 13km, measured on google maps
    modelWidth: 20000
  }
};

export default presets;
