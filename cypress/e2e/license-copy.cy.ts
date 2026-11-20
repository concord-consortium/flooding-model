context("License copy", () => {
  beforeEach(() => {
    cy.visit("");
  });

  ["about", "share"].forEach(id => {
    it(`shows the copyright line at 12px in the ${id} dialog`, () => {
      cy.get(`[data-testid="${id}"]`).click();
      cy.get('[data-testid="license-copy"] p').last()
        .should("contain.text", "The Concord Consortium, Inc.")
        .and("have.css", "font-size", "12px");
    });
  });
});
