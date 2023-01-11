import Maps from "../../support/elements/maps";

const maps = new Maps;

const mapType = {
    map1: "Street",
    map2: "Topographic",
    map3: "Permeability"
};

context("Test the maps types", () => {
  beforeEach(() => {
    cy.visit("");
  });

  describe("Map Types", () => {
    it("Test Street Map", () => {
        maps.getMapTab().click();
        maps.verifyHeader();
        maps.getActiveMapButton(mapType.map1);
        maps.verifyMapButton(mapType.map1);
    });
    it("Test Topographic Map", () => {
        maps.getMapTab().click();
        maps.clickMapButton(mapType.map2);
        maps.getActiveMapButton(mapType.map2);
        maps.getActiveMapButton(mapType.map2);
        maps.verifyMapButton(mapType.map2);
    });
    it("Test Permeability Map", () => {
        maps.getMapTab().click();
        maps.clickMapButton(mapType.map3);
        maps.getActiveMapButton(mapType.map3);
        maps.getActiveMapButton(mapType.map3);
        maps.verifyMapButton(mapType.map3);
    });
  });
});
