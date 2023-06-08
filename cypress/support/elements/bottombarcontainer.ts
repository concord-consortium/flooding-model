class BottomBarContainer{

  getBottomBar() {
    return cy.get("[class^='bottom-bar-container--bottomBar']");
  }
  getAmountOfRain() {
    return this.getBottomBar().find(".bottom-bar--amountOfRain--__flooding-v1__");
  }
  moveAmountOfRainSlider(slider: any) {
    const option = ["Light", "Med", "Heavy", "Ext"];
    this.getAmountOfRain().find(".MuiSlider-markLabel").eq(option.indexOf(slider)).click({ force: true });
  }
  verifyAmountOfRainSlider() {
    this.getAmountOfRain().find(".MuiSlider-markLabel")
      .should("contain", "Light")
      .should("contain", "Med")
      .should("contain", "Heavy")
      .should("contain", "Ext");
  }
  getStormDuration() {
    return this.getBottomBar().find(".bottom-bar--stormDuration--__flooding-v1__");
  }
  selectStormDuration(item: any) {
    const option = ["Short", "Medium", "Long", "Very Long"];
    cy.get("[data-testid='rain-duration-select']").click();
    cy.get("#menu- .MuiListItem-button").eq(option.indexOf(item)).click({ force: true });
  }
  verifyStormDurationDropDown() {
    cy.get("[data-testid='rain-duration-select']").click();
    cy.get("#menu- .MuiListItem-button")
      .should("contain", "Short")
      .should("contain", "Medium")
      .should("contain", "Long")
      .should("contain", "Very Long");
  }
  getStartingWaterLevel() {
    return this.getBottomBar().find(".bottom-bar--startingWaterLevel--__flooding-v1__");
  }
  moveStartingWaterLevelSlider(slider: any) {
    const option = ["Low", "Med", "High"];
    this.getStartingWaterLevel().find(".MuiSlider-markLabel").eq(option.indexOf(slider)).click({ force: true });
  }
  verifyStartingWaterLevelSlider() {
    this.getStartingWaterLevel().find(".MuiSlider-markLabel")
      .should("contain", "Low")
      .should("contain", "Med")
      .should("contain", "High");
  }
  getLeevesButton() {
    return this.getBottomBar().find("[data-testid='levees-button']");
  }
  getReloadButton() {
    return this.getBottomBar().find("[data-testid='reload-button']");
  }
  getRestartButton() {
    return this.getBottomBar().find("[data-testid='restart-button']");
  }
  getStartStopButton() {
    return this.getBottomBar().find("[data-testid='start-stop-button']");
  }
  getTimeSlider() {
    return this.getBottomBar().find(".bottom-bar--timeSlider--__flooding-v1__");
  }
  getFullScreenIcon() {
    return this.getBottomBar().find("[class^='bottom-bar-container--fullscreenIcon']");
  }
  getTimeText() {
    return cy.get(".app--topLeftControls--__flooding-v1__ .time-display--text--__flooding-v1__ div").eq(0);
  }

  getGraphTabSection() {
    return cy.get('#react-tabs-2');
  }
  getGauge1TabSection() {
    return cy.get('#react-tabs-4');
  }
  getGauge2TabSection() {
    return cy.get('#react-tabs-6');
  }
  getGauge3TabSection() {
    return cy.get('#react-tabs-8');
  }

}
export default BottomBarContainer;
