import { UIModel } from "./ui";
import { getDefaultConfig } from "../config";
import { Vector3 } from "three";

describe("UI model", () => {
  describe("reload", () => {
    it("restores user settings", () => {
      const config = getDefaultConfig();
      const ui = new UIModel(config);

      ui.tabIndex = 123;
      ui.mainLayer = "permeability123" as "permeability"; // just to ensure we don't set the default value from config
      ui.poiLayerEnabled = false;
      ui.placesLayerEnabled = false;

      ui.reload();

      expect(ui.tabIndex).toEqual(config.tabs.indexOf(config.activeTab));
      expect(ui.mainLayer).toEqual(config.mapType);
      expect(ui.poiLayerEnabled).toEqual(true);
      expect(ui.placesLayerEnabled).toEqual(true);
    });
  });

  describe("setCameraDistance", () => {
    it("is bound by config min value and canZoomIn is updated when it's reached", () => {
      const config = getDefaultConfig();
      const ui = new UIModel(config);
      expect(ui.canZoomIn()).toEqual(true);
      ui.setCameraDistance(0);
      expect(ui.getCameraDistance()).toEqual(config.minCameraDistance);
      expect(ui.canZoomIn()).toEqual(false);
    });

    it("is bound by config max value and canZoomOut is updated when it's reached", () => {
      const config = getDefaultConfig();
      const ui = new UIModel(config);
      expect(ui.canZoomOut()).toEqual(true);
      ui.setCameraDistance(Infinity);
      expect(ui.getCameraDistance()).toEqual(config.maxCameraDistance);
      expect(ui.canZoomOut()).toEqual(false);
    });
  });

  describe("isCameraPosModified", () => {
    it("checks wether camera position has been modified", () => {
      const config = getDefaultConfig();
      const ui = new UIModel(config);

      expect(ui.isCameraPosModified()).toEqual(false);
      ui.setCameraPos(new Vector3(1, 2, 3));
      expect(ui.isCameraPosModified()).toEqual(true);

      ui.resetCameraPos();
      expect(ui.isCameraPosModified()).toEqual(false);
    });
  });
});
