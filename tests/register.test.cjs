const { validateRegister } = require('../auth/registerUtils.js');

test("valid register", () => {
  expect(validateRegister("test@test.com", "123")).toBe(true);
});

test("missing email", () => {
  expect(validateRegister("", "123")).toBe(false);
});

test("invalid email", () => {
  expect(validateRegister("test", "123")).toBe(false);
});

test("short password", () => {
  expect(validateRegister("test@test.com", "1")).toBe(false);
});