import { UIModel } from "./ui";
import { getDefaultConfig } from "../config";

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
});