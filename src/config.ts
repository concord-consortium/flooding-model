
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
  // During the flood event ground permeability is lower than typically, as the water table is very high.
  // This parameter lets you set exact value.
  floodPermeabilityMult: number;
  // Parameter that decides how fast river stage will increase during rain event.
  riverStageIncreaseSpeed: number;
  // [light rain strength, medium rain strength, heavy rain strength, extreme rain strength]
  rainStrength: [number, number, number, number];
  // Arbitrary value that transforms model time to hours when the time needs to be presented to user.
  // We're trying to make sure that 24 hours take around 8 seconds of real world time.
  // But this will greatly depend on performance of the user machine at this point and might require more work later.
  modelTimeToHours: number;
  // Rain starts with small delay, it's sunny at the beginning of the simulation.
  rainStartDay: number;
  // Enables 3D rendering of elevation data.
  view3d: boolean;
  // This value can be used to make elevation more pronounced, but only during rendering.
  view3dElevationMult: number;
  crossSections: ICrossSectionConfig[];
  // Length of the river bank segment that is used to construct levees (in meters).
  riverBankSegmentLength: number;
  // Height of the levee.
  leveeHeight: number;
  // Number of available levee segments.
  maxLevees: number;
  // Visual layers.
  topoTexture: string | null;
  streetTexture: string | null;
  permeabilityTexture: string | null;
  // Optional layer with scale image.
  scaleImg: string | null;
  // Optional layer with places.
  placeLabelsImg: string | null;
  // Optional layer with POIs.
  pointsOfInterestImg: string | null;
  // Max length of simulation in days.
  simulationLength: number;
  // UI options below:
  // Extreme rain option availability.
  extremeRain: boolean;
  // List of visible tabs.
  tabs: ("maps" | "graph" | "gauge1" | "gauge2" | "gauge3")[];
  // Initial rain intensity.
  rainIntensity: "light" | "medium" | "heavy" | "extreme";
  // Initial rain duration.
  rainDuration: number;
  // Initial starting water level.
  startingWaterLevel: "low" | "medium" | "high";
  // Initial map type.
  mapType: "street" | "topo" | "permeability";
  // Initially selected tab.
  activeTab: "maps" | "graph" | "gauge1" | "gauge2" | "gauge3";
  // Experimental. Some features are not working. timeStep and speedMult need adjustment. Sample config:
  // - ?useGPU=true&timeStep=0.4&speedMult=40
  useGPU: boolean;
  // Min zoom level.
  minCameraDistance: number;
  // Max zoom level.
  maxCameraDistance: number;
}

export interface ICoords {
  x: number;
  y: number;
}

export interface ICrossSectionConfig {
  minRiverDepth: number;
  maxRiverDepth: number;
  maxFloodDepth: number;
  riverGauge: ICoords;
  leftLevee: ICoords;
  rightLevee: ICoords;
  leftLandGauge: ICoords;
  rightLandGauge: ICoords;
  marker: {
    img: string,
    highlightImg: string,
    anchorX?: number,
    anchorY?: number,
    scale?: number
  }
}

export interface IUrlConfig extends ISimulationConfig {
  preset: string;
}

export const getDefaultConfig: () => IUrlConfig = () => ({
  preset: "RiverCity",
  timeStep: 5,
  speedMult: 2,
  modelWidth: 8000,
  modelHeight: 8000,
  dampingFactor: 0.99,
  get cellSize() { return this.modelWidth / this.gridWidth; },
  get gridHeight() { return Math.ceil(this.modelHeight / this.cellSize); },
  elevation: [[ 0 ]],
  permeability: [[ 0 ]],
  permeabilityValues: [0.5, 0.05, 0.005],
  minElevation: 0,
  maxElevation: 100,
  riverData: null,
  waterDepth: null,
  waterHeightmapMaxDepth: 10,
  gridWidth: 300,
  fillTerrainEdges: true,
  showCoordsOnClick: false,
  elevationVerticalTilt: 0,
  floodPermeabilityMult: 0.1,
  riverStageIncreaseSpeed: 0.125,
  rainStrength: [0.0025, 0.005, 0.0075, 0.02],
  modelTimeToHours: 0.05,
  rainStartDay: 1,
  view3d: false,
  view3dElevationMult: 1,
  crossSections: [],
  riverBankSegmentLength: 700, // m
  leveeHeight: 4, // m
  maxLevees: 10,
  topoTexture: null,
  streetTexture: null,
  permeabilityTexture: null,
  scaleImg: null,
  placeLabelsImg: null,
  pointsOfInterestImg: null,
  simulationLength: 14, // days
  extremeRain: true,
  tabs: ["maps", "graph", "gauge1", "gauge2", "gauge3"],
  rainIntensity: "medium",
  rainDuration: 2,
  startingWaterLevel: "medium",
  mapType: "street",
  activeTab: "gauge1",
  useGPU: false,
  minCameraDistance: 1,
  maxCameraDistance: 4
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
