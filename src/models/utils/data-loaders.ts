import { ISimulationConfig } from "../../config";
import { getInputData } from "./image-utils";

export const getElevationData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.elevation) {
    return Promise.resolve(undefined);
  }
  const elevationDiff = config.maxElevation - config.minElevation;
  return getInputData(config.elevation, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // Elevation data is supposed to black & white image, where black is the lowest point and
      // white is the highest.
      return rgba[0] / 255 * elevationDiff + config.minElevation;
    }
  );
};

export const getRiverData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.riverData) {
    return Promise.resolve(undefined);
  }
  return getInputData(config.riverData, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // River texture is black & white, river is black.
      return rgba[0] < 128 ? 1 : 0;
    }
  );
};

export const getWaterDepthData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.waterDepth) {
    return Promise.resolve(undefined);
  }
  return getInputData(config.waterDepth, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // Water depth data is supposed to black & white image, where black is the lowest point and
      // white is the highest.
      return rgba[0] / 255 * config.waterHeightmapMaxDepth;
    }
  );
};

export const getPermeabilityData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.permeability) {
    return Promise.resolve(undefined);
  }
  return getInputData(config.permeability, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      // Permeability image will usually have three colors: red, green, blue.
      if (rgba[0] > 128) { // red
        return config.permeabilityValues[0] || 0;
      } else if (rgba[1] > 128) { // green
        return config.permeabilityValues[1] || 0;
      } else { // blue
        return config.permeabilityValues[2] || 0;
      }
    }
  );
};
