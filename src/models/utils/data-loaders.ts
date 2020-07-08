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
