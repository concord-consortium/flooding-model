import { TerrainType } from "../../types";
import { ISimulationConfig } from "../../config";
import { getInputData } from "./image-utils";
import { Zone } from "../zone";

// Maps zones config to image data files (see data dir). E.g. it can generate file names like:
// - data/plains-plains
// - data/plains-mountains
// etc.
const zonesToImageDataFile = (zones: Zone[]) => {
  const zoneTypes: string[] = [];
  zones.forEach((z, i) => {
    zoneTypes.push(TerrainType[z.terrainType].toLowerCase());
  });
  return "data/" + zoneTypes.join("-");
};

export const getZoneIndex = (config: ISimulationConfig): Promise<number[] | undefined> => {
  return getInputData(config.zoneIndex, config.gridWidth, config.gridHeight, false,
    (rgba: [number, number, number, number]) => {
      // Red is zone 1, green is zone 2, and blue is zone 3.
      if (rgba[0] >= rgba[1] && rgba[0] >= rgba[2]) {
        return 0;
      }
      if (rgba[1] >= rgba[0] && rgba[1] >= rgba[2]) {
        return 1;
      }
      return 2;
    }
  );
};

export const getElevationData = (config: ISimulationConfig, zones: Zone[]): Promise<number[] | undefined> => {
  // If `elevation` height map is provided, it will be loaded during model initialization.
  // Otherwise, height map URL will be derived from zones `terrainType` properties.
  let elevation = config.elevation;
  if (!elevation) {
    elevation = zonesToImageDataFile(zones) + "-heightmap.png";
  }
  return getInputData(elevation, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // Elevation data is supposed to black & white image, where black is the lowest point and
      // white is the highest.
      return rgba[0] / 255 * config.heightmapMaxElevation;
    }
  );
};

export const getRiverData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.riverData) {
    return Promise.resolve(undefined);
  }
  return getInputData(config.riverData, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // River texture is mostly transparent, so look for non-transparent cells to define shape
      return rgba[3] > 0 ? 1 : 0;
    }
  );
};
