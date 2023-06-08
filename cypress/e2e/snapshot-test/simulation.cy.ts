import BottomBarContainer from "../../support/elements/bottombarcontainer";
import { addMatchImageSnapshotCommand } from "cypress-image-snapshot/command";

addMatchImageSnapshotCommand({
  customDiffDir: "cypress/snapshots-diff",
  failureThreshold: 0.03, // threshold for entire image
  failureThresholdType: "percent", // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: "viewport" // capture viewport in screenshot
});

const bottombar = new BottomBarContainer;

context("Test the maps types", () => {
  beforeEach(() => {
    cy.visit("");
  });

  describe("Simulation Test", () => {
    it("Test Simulation With Light Rain, Short Storm & Low Water Level", () => {
        bottombar.moveAmountOfRainSlider("Light");
        bottombar.selectStormDuration("Short");
        bottombar.moveStartingWaterLevelSlider("Low");
        bottombar.getStartStopButton().click();
        bottombar.getTimeText().contains("14", { timeout: 70000 });
        cy.matchImageSnapshot("Scenario1_Gauge1");
        bottombar.getGraphTabSection().click();
        cy.matchImageSnapshot("Scenario1_Graph");
        bottombar.getGauge2TabSection().click();
        cy.matchImageSnapshot("Scenario1_Gauge2");
        bottombar.getGauge3TabSection().click();
        cy.matchImageSnapshot("Scenario1_Gauge3");
    });
    it("Test Simulation With Med Rain, Medium Storm & Med Water Level", () => {
        bottombar.moveAmountOfRainSlider("Med");
        bottombar.selectStormDuration("Medium");
        bottombar.moveStartingWaterLevelSlider("Med");
        bottombar.getStartStopButton().click();
        bottombar.getTimeText().contains("14", { timeout: 70000 });
        cy.matchImageSnapshot("Scenario2_Gauge1");
        bottombar.getGraphTabSection().click();
        cy.matchImageSnapshot("Scenario2_Graph");
        bottombar.getGauge2TabSection().click();
        cy.matchImageSnapshot("Scenario2_Gauge2");
        bottombar.getGauge3TabSection().click();
        cy.matchImageSnapshot("Scenario2_Gauge3");
    });
    it("Test Simulation With Heavy Rain, Long Storm & High Water Level", () => {
        bottombar.moveAmountOfRainSlider("Heavy");
        bottombar.selectStormDuration("Long");
        bottombar.moveStartingWaterLevelSlider("High");
        bottombar.getStartStopButton().click();
        bottombar.getTimeText().contains("14", { timeout: 70000 });
        cy.matchImageSnapshot("Scenario3_Gauge1");
        bottombar.getGraphTabSection().click();
        cy.matchImageSnapshot("Scenario3_Graph");
        bottombar.getGauge2TabSection().click();
        cy.matchImageSnapshot("Scenario3_Gauge2");
        bottombar.getGauge3TabSection().click();
        cy.matchImageSnapshot("Scenario3_Gauge3");
    });
    it("Test Simulation With Ext Rain, Long Storm & Med Water Level", () => {
        bottombar.moveAmountOfRainSlider("Ext");
        bottombar.selectStormDuration("Very Long");
        bottombar.moveStartingWaterLevelSlider("High");
        bottombar.getStartStopButton().click();
        bottombar.getTimeText().contains("14", { timeout: 70000 });
        cy.matchImageSnapshot("Scenario4_Gauge1");
        bottombar.getGraphTabSection().click();
        cy.matchImageSnapshot("Scenario4_Graph");
        bottombar.getGauge2TabSection().click();
        cy.matchImageSnapshot("Scenario4_Gauge2");
        bottombar.getGauge3TabSection().click();
        cy.matchImageSnapshot("Scenario4_Gauge3");
    });
  });
});
