
export interface ISimulationConfig {
  timeStep: number; // model time
  speedMult: number; // simulation speed multiplier, should be integer
  modelWidth: number; // m
  modelHeight: number; // m
  // Note that modelHeight % gridWidth should always be 0!
  gridWidth: number; // m
  // It will be calculated automatically using model dimensions and grid width.
  readonly gridHeight: number; // m
  // It will be calculated automatically using model dimensions and grid width.
  readonly cellSize: number; // m
  // If `elevation` height map is provided, it will be loaded during model initialization and terrain setup dialog
  // won't let users change terrain type.
  elevation: number[][] | string;
  // Elevation of 100% black points in heightmap (image used for elevation data).
  minElevation: number; // m
  // Elevation of 100% white points in heightmap (image used for elevation data).
  maxElevation: number; // m
  // Visually fills edges of the terrain by setting elevation to 0.
  fillTerrainEdges: boolean;
  riverData: string | null;
  // Displays alert with current coordinates on mouse click. Useful for authoring.
  showCoordsOnClick: boolean;
  riverColor: [number, number, number, number];
  // Post processing of elevation data. Tilts elevation data in one axis. Value in %, usually between -100 and 100.
  // Useful to compensate the fact that upstream river part is usually placed higher than downstream part.
  elevationVerticalTilt: number;
  // Visual layer.
  texture: string;
  waterIncrement: number;
  waterDecrement: number;
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
  get cellSize() { return this.modelWidth / this.gridWidth; },
  get gridHeight() { return Math.ceil(this.modelHeight / this.cellSize); },
  elevation: "data/model2_heightmap_hi.png",
  minElevation: 162,
  maxElevation: 238,
  riverData: "data/model2_map_riverdata.png",
  texture: "data/model2_map_topo.png",
  gridWidth: 300,
  fillTerrainEdges: true,
  showCoordsOnClick: false,
  riverColor: [0.314, 0.675, 1, 1],
  elevationVerticalTilt: 0,
  waterIncrement: 0.1,
  waterDecrement: 0
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
