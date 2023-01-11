import BottomBarContainer from "../../support/elements/bottombarcontainer";

const bottombar = new BottomBarContainer;

context("Test the bottom bar container", () => {
  beforeEach(() => {
    cy.visit("");
  });

  describe("Bottom Bar Container", () => {
    it("Verify Amount Of Rain", () => {
        bottombar.getAmountOfRain().should("exist");
        bottombar.getAmountOfRain().should("contain", "Amount of Rain");
        bottombar.verifyAmountOfRainSlider();
    });
    it("Verify Storm Duration", () => {
        bottombar.getStormDuration().should("exist");
        bottombar.getStormDuration().should("contain", "Storm");
        bottombar.getStormDuration().should("contain", "Duration");
        bottombar.verifyStormDurationDropDown();
    });
    it("Verify Starting Water Level", () => {
        bottombar.getStartingWaterLevel().should("exist");
        bottombar.getStartingWaterLevel().should("contain", "Starting");
        bottombar.getStartingWaterLevel().should("contain", "Water Level");
        bottombar.verifyStartingWaterLevelSlider();
    });
    it("Verify Bottom Buttons", () => {
        bottombar.getLeevesButton().should("exist");
        bottombar.getReloadButton().should("exist");
        bottombar.getRestartButton().should("exist");
        bottombar.getStartStopButton().should("exist");
        bottombar.getTimeSlider().should("exist");
        bottombar.getFullScreenIcon().should("exist");
    });
  });
});
