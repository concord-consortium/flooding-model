import { ISimulationConfig } from "./config";

const presets: {[key: string]: Partial<ISimulationConfig>} = {
  iowa: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 147, // lowest point around 195m, highest around 235, 45m diff = 147 ft
    elevationVerticalTilt: 0,
    modelHeight: 42650, // around 13km, measured on google maps
    modelWidth: 66308
  },
  iowaTilt: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 147, // lowest point around 195m, highest around 235, 45m diff = 147 ft
    elevationVerticalTilt: -10,
    modelHeight: 42650, // around 13km, measured on google maps
    modelWidth: 66308
  },
  iowaAmplified1: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 147 * 5, // lowest point around 195m, highest around 235, 45m diff = 147 ft
    elevationVerticalTilt: -10 * 5,
    modelHeight: 42650, // around 13km, measured on google maps
    modelWidth: 66308
  },
  iowaAmplified2: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 147 * 10, // lowest point around 195m, highest around 235, 45m diff = 147 ft
    elevationVerticalTilt: -10 * 10,
    modelHeight: 42650, // around 13km, measured on google maps
    modelWidth: 66308
  },
  iowaAmplified3: {
    elevation: "data/iowa-city-heightmap.png",
    riverData: "data/iowa-city-river.png",
    texture: "data/iowa-city-streetmap.png",
    heightmapMaxElevation: 147 * 20, // lowest point around 195m, highest around 235, 45m diff = 147 ft
    elevationVerticalTilt: -100 * 20,
    modelHeight: 42650, // around 13km, measured on google maps
    modelWidth: 66308
  }
};

export default presets;
