describe("signup", () => {
  beforeEach(() => {
    cy.visit("/auth/signup");
  });

  it("should load the signup page", () => {
    cy.get("body").should("be.visible");
  });

  it("should have email and password fields", () => {
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");
  });
});
