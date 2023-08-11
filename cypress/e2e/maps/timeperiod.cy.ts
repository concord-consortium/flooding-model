import Maps from "../../support/elements/maps";

const maps = new Maps;

const timePeriod = {
    past: "cf196ba596d43ea09399.png",
    present: "de8b4c7c42a3c60db2a9.png",
    future: "2daf22c4724ea36fde22.png"
};

context("Test the time period", () => {
  beforeEach(() => {
    cy.visit("");
    maps.getMapTab().click();
    maps.verifyHeader();
    maps.verifyTimePeriodNote();
  });

  describe("Time Period", () => {
    it("Test Time Period", () => {
      maps.verifyTimPeriodLabel();
      maps.getActiveTimePeriodButton("Present");
  });
    it("Test Past", () => {
      maps.clickTimePeriod("Past");
      maps.getActiveTimePeriodButton("Past");
      maps.VerifyTimePeriodImage("Past", timePeriod.past);
    });
    it("Test Present", () => {
      maps.clickTimePeriod("Present");
      maps.getActiveTimePeriodButton("Present");
      maps.VerifyTimePeriodImage("Present", timePeriod.present);
    });
    it("Test Future", () => {
      maps.clickTimePeriod("Future");
      maps.getActiveTimePeriodButton("Future");
      maps.VerifyTimePeriodImage("Future", timePeriod.future);
    });
  });
});

context("Test the time period not displayed", () => {

  describe("Time Period should not display when url parm is passed ", () => {
    it("Test url parm with past", () => {
      cy.visit("/?preset=past");
      maps.getMapTab().click();
      maps.getTimePeriod().should("not.exist");
      maps.verifyMapHeader();
    });
    it("Test url parm with present", () => {
      cy.visit("/?preset=present");
      maps.getMapTab().click();
      maps.getTimePeriod().should("not.exist");
      maps.verifyMapHeader();
    });
    it("Test url parm with Future", () => {
      cy.visit("/?preset=future");
      maps.getMapTab().click();
      maps.getTimePeriod().should("not.exist");
      maps.verifyMapHeader();
    });
  });
});
