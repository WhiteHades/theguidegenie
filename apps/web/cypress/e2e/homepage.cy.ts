// Simple core tests - expand these later as features are built out
describe("homepage", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the homepage successfully", () => {
    cy.get("body").should("be.visible");
  });

  it("should have navigation", () => {
    cy.get("nav").should("exist");
  });

  it("should have a color mode toggle", () => {
    cy.get('[data-test="color-mode-toggle"]').should("exist");
  });
});
