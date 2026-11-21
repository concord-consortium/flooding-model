context("Top bar", () => {
  beforeEach(() => {
    cy.visit("");
  });

  it("puts its buttons in Tab order from left to right", () => {
    cy.get('[data-testid="reload"], [data-testid="share"], [data-testid="about"]').then($buttons => {
      const buttons = $buttons.toArray();
      expect(buttons.map(b => b.getAttribute("data-testid"))).to.deep.equal(["reload", "share", "about"]);
      const lefts = buttons.map(b => b.getBoundingClientRect().left);
      expect(lefts[0]).to.be.lessThan(lefts[1]);
      expect(lefts[1]).to.be.lessThan(lefts[2]);
    });
  });
});
