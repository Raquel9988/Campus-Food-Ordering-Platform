const { validateLogin } = require('../auth/loginUtils.js');

test("valid login", () => {
  expect(validateLogin("test@test.com", "123")).toBe(true);
});

test("missing email", () => {
  expect(validateLogin("", "123")).toBe(false);
});

test("missing password", () => {
  expect(validateLogin("test@test.com", "")).toBe(false);
});