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

const rgbToHue = (rgb: number[]) => {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    h = 0; // achromatic
  } else {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return h * 360;
};

export const getPermeabilityData = (config: ISimulationConfig): Promise<number[] | undefined> => {
  if (!config.permeability) {
    return Promise.resolve(undefined);
  }
  return getInputData(config.permeability, config.gridWidth, config.gridHeight, true,
    (rgba: [number, number, number, number]) => {
      const hue = rgbToHue(rgba);
      if (hue >= 89 && hue < 133) { // green, hue ~123
        return config.permeabilityValues[0] || 0;
      } else if (hue >= 44 && hue < 89) { // yellow, hue ~55
        return config.permeabilityValues[1] || 0;
      } else if (hue > 23 && hue < 44) { // orange, hue ~33
        return config.permeabilityValues[2] || 0;
      } else {
        throw new Error(`Incorrect permeability data image, color ${rgba}, hue: ${hue} is not recognized`);
      }
    }
  );
};
