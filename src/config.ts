
export interface ISimulationConfig {
  modelWidth: number; // m
  modelHeight: number; // m
  // Note that modelHeight % gridWidth should always be 0!
  gridWidth: number; // m
  // It will be calculated automatically using model dimensions and grid width.
  readonly gridHeight: number; // m
  // It will be calculated automatically using model dimensions and grid width.
  readonly cellSize: number; // m
  // If `elevation` height map is provided, it will be loaded during model initialization and terrain setup dialog
  // won't let users change terrain type. Otherwise, height map URL will be derived from zones `terrainType` properties.
  elevation: number[][] | string;
  maxTimeStep: number; // minutes
  // One day in model should last X seconds in real world.
  modelDayInSeconds: number;
  // Max elevation of 100% white points in heightmap (image used for elevation data).
  heightmapMaxElevation: number; // m
  // Visually fills edges of the terrain by setting elevation to 0.
  fillTerrainEdges: boolean;
  riverData: string | null;
  // Displays alert with current coordinates on mouse click. Useful for authoring.
  showCoordsOnClick: boolean;
  riverColor: [number, number, number, number];
  renderWaterLevel: boolean;
  // Post processing of elevation data. Tilts elevation data in one axis. Useful for flooding experiment,
  // to compensate the fact that upstream river part is usually placed higher than downstream part.
  elevationVerticalTilt: number;
  texture: string;
}

export interface IUrlConfig extends ISimulationConfig {
  preset: string;
}

export const getDefaultConfig: () => IUrlConfig = () => ({
  preset: "iowa",
  modelWidth: 66308,
  modelHeight: 42650,
  elevation: "data/iowa-city-heightmap.png",
  riverData: "data/iowa-city-river.png",
  gridWidth: 400,
  get cellSize() { return this.modelWidth / this.gridWidth },
  get gridHeight() { return Math.ceil(this.modelHeight / this.cellSize) },
  maxTimeStep: 180, // minutes
  modelDayInSeconds: 8, // one day in model should last X seconds in real world
  // This value works well with existing heightmap images.
  heightmapMaxElevation: 20000,
  fillTerrainEdges: true,
  showCoordsOnClick: false,
  riverColor: [0.067, 0.529, 0.882, 1],
  renderWaterLevel: false,
  elevationVerticalTilt: 0,
  texture: ""
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
        urlConfig[key] = urlValue!.substring(1, urlValue!.length - 1).split(",");
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
