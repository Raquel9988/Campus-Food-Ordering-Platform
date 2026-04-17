const { validateRegister } = require('../auth/registerUtils.js');


// 🔹 VALID CASES
test("valid student registration", () => {
  expect(validateRegister("test@test.com", "student", "")).toBe(true);
});

test("valid vendor registration", () => {
  expect(validateRegister("test@test.com", "vendor", "My Shop")).toBe(true);
});


// 🔹 INVALID CASES
test("missing email", () => {
  expect(validateRegister("", "student", "")).toBe(false);
});

test("invalid email", () => {
  expect(validateRegister("test", "student", "")).toBe(false);
});

test("missing role", () => {
  expect(validateRegister("test@test.com", "", "")).toBe(false);
});

test("vendor missing business name", () => {
  expect(validateRegister("test@test.com", "vendor", "")).toBe(false);
});