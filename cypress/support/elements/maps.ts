class Maps{

  getMapTab() {
    return cy.get("#tab\\:r1\\:0");
  }
  getMapTabSection() {
    return cy.get("#panel\\:r1\\:0");
  }
  verifyHeader() {
    this.getMapTabSection().find("[class^='header']").should("have.text", "MapsTime Period");
  }
  clickMapButton(type: any) {
    const option = ["Street", "Topographic", "Permeability"];
    this.getMapTabSection().find("[class^='maps-tab--mapButton--']").eq(option.indexOf(type)).click({ force: true });
  }
  getActiveMapButton(type: any) {
    const option = ["Street", "Topographic", "Permeability"];
    this.getMapTabSection().find("[class^='maps-tab--mapButton--']").eq(option.indexOf(type)).invoke("attr", "class").should("contain", "active");
    this.getMapTabSection().find("[class^='maps-tab--mapButton--']").eq(option.indexOf(type)).find("#View_ICON").should("exist");
  }
  verifyMapButton(type: any) {

    switch (type) {
        case ("Street"):
        cy.get("[class^='maps-tab--mapButton--']").eq(0).find("[class^='maps-tab--background']").invoke("attr", "style").should("contain", "dba2a12eb1ed54cc1523.png");
        cy.get("[class^='maps-tab--mapButton--']").eq(0).find("[class^='maps-tab--title']").should("have.text", "Street");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--checkboxes']")
          .should("contain", "Labels")
          .should("contain", "Places")
          .should("contain", "Points of interest");
            break;
        case ("Topographic"):
        cy.get("[class^='maps-tab--mapButton--']").eq(1).find("[class^='maps-tab--background']").invoke("attr", "style").should("contain", "b7b081d7d18a4a2ff980.png");
        cy.get("[class^='maps-tab--mapButton--']").eq(1).find("[class^='maps-tab--title']").should("have.text", "Topographic");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend']")
          .should("contain", "Key")
          .should("contain", "Flat terrain")
          .should("contain", "Hilly terrain");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend'] [class^='maps-tab--comment']").should("contain", "Note: darker shaded areas are steeper");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--checkboxes']")
          .should("contain", "Labels")
          .should("contain", "Places")
          .should("contain", "Points of interest");
            break;
        case ("Permeability"):
        cy.get("[class^='maps-tab--mapButton--']").eq(2).find("[class^='maps-tab--background']").invoke("attr", "style").should("contain", "e73b552e7334a0a32bc9.png");
        cy.get("[class^='maps-tab--mapButton--']").eq(2).find("[class^='maps-tab--title']").should("have.text", "Permeability");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend']").find(".maps-tab--green--__flooding-v1__").should("exist");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend']").find(".maps-tab--yellow--__flooding-v1__").should("exist");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend']").find(".maps-tab--orange--__flooding-v1__").should("exist");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--legend']")
          .should("contain", " High (rural)")
          .should("contain", "Medium (suburban)")
          .should("contain", "Low (urban)");
        cy.get("[class^='maps-tab--mapButton--'] [class^='maps-tab--checkboxes']")
          .should("contain", "Labels")
          .should("contain", "Places")
          .should("contain", "Points of interest");
            break;
    }
  }

}
export default Maps;
