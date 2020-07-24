
export interface ISimulationConfig {
  timeStep: number; // model time
  speedMult: number; // simulation speed multiplier, should be integer
  modelWidth: number; // m
  modelHeight: number; // m
  // Note that modelHeight % gridWidth should always be 0!
  gridWidth: number; // m
  // Lower damping factor increase viscosity of the fluid, so it'll feel more like oil, but also stabilize faster.
  // Waves will disappear faster. Keep value closer to 1 to have fluid more similar to water.
  dampingFactor: number;
  // It will be calculated automatically using model dimensions and grid width.
  readonly gridHeight: number; // m
  // It will be calculated automatically using model dimensions and grid width.
  readonly cellSize: number; // m
  // Heightmap or 2d array with elevation.
  elevation: number[][] | string;
  // Permeability zone number. Each number or color is mapped to value in permeabilityValues in the simulation engine.
  // If image is used, expected colors are: red (index 0), green (index 1), blue (index 2).
  permeability: number[][] | string;
  // Permeability value for each permeability zone.
  permeabilityValues: number[];
  // Black & white image with river or 2d array with 0 (regular cell) and 1 (river cell).
  riverData:  number[][] | string | null;
  // Heightmap with inital water depth or 2d array with water depth.
  waterDepth: number[][] | string | null;
  // Elevation of 100% black points in elevation heightmap.
  minElevation: number; // m
  // Elevation of 100% white points in elevation heightmap.
  maxElevation: number; // m
  // Elevation of 100% white points in water depth heightmap.
  waterHeightmapMaxDepth: number; // m
  // Visually fills edges of the terrain by setting elevation to 0.
  fillTerrainEdges: boolean;
  // Displays alert with current coordinates on mouse click. Useful for authoring.
  showCoordsOnClick: boolean;
  // Post processing of elevation data. Tilts elevation data in one axis. Value in %, usually between -100 and 100.
  // Useful to compensate the fact that upstream river part is usually placed higher than downstream part.
  elevationVerticalTilt: number;
  // Visual layer.
  texture: string | null;
  riverWaterIncrement: number;
}

export interface IUrlConfig extends ISimulationConfig {
  preset: string;
}

export const getDefaultConfig: () => IUrlConfig = () => ({
  preset: "RiverCity",
  timeStep: 1,
  speedMult: 3,
  modelWidth: 8000,
  modelHeight: 8000,
  dampingFactor: 0.99,
  get cellSize() { return this.modelWidth / this.gridWidth; },
  get gridHeight() { return Math.ceil(this.modelHeight / this.cellSize); },
  elevation: [[ 0 ]],
  permeability: [[ 0 ]],
  permeabilityValues: [ 0 ],
  minElevation: 0,
  maxElevation: 100,
  riverData: null,
  waterDepth: null,
  waterHeightmapMaxDepth: 10,
  texture: null,
  gridWidth: 300,
  fillTerrainEdges: true,
  showCoordsOnClick: false,
  elevationVerticalTilt: 0,
  riverWaterIncrement: 0
});

const getURLParam = (name: string) => {
  const url = (self || window).location.href;
  name = name.replace(/[[]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return true;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

const isArray = (value: any) => {
  return typeof value === "string" && value.match(/^\[.*\]$/);
};

const isJSON = (value: any) => {
  if (typeof value !== "string") {
    return false;
  }
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

export const getUrlConfig: () => IUrlConfig = () => {
  const urlConfig: any = {};
  // Populate `urlConfig` with values read from URL.
  Object.keys(getDefaultConfig()).forEach((key) => {
    const urlValue: any = getURLParam(key);
    if (urlValue === true || urlValue === "true") {
      urlConfig[key] = true;
    } else if (urlValue === "false") {
      urlConfig[key] = false;
    } else if (isJSON(urlValue)) {
      urlConfig[key] = JSON.parse(urlValue);
    } else if (isArray(urlValue)) {
      // Array can be provided in URL using following format:
      // &parameter=[value1,value2,value3]
      if (urlValue === "[]") {
        urlConfig[key] = [];
      } else {
        urlConfig[key] = urlValue.substring(1, urlValue.length - 1).split(",");
      }
    } else if (urlValue !== null && !isNaN(urlValue)) {
      // !isNaN(string) means isNumber(string).
      urlConfig[key] = parseFloat(urlValue);
    } else if (urlValue !== null) {
      urlConfig[key] = urlValue;
    }
  });
  return urlConfig as IUrlConfig;
};
