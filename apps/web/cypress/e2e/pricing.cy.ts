describe("pricing page", () => {
  beforeEach(() => {
    cy.visit("/pricing");
  });

  it("should load the pricing page", () => {
    cy.get("body").should("be.visible");
  });

  it("should show pricing heading", () => {
    cy.get("h1").should("exist");
  });
});
