const {
  validateLogin,
  getRedirectPage,
  getVendorStatusMessage
} = require('../auth/loginUtils.js');


// 🔹 LOGIN TESTS (UPDATED FOR OTP)
test("valid email login", () => {
  expect(validateLogin("test@test.com")).toBe(true);
});

test("missing email", () => {
  expect(validateLogin("")).toBe(false);
});


// 🔹 REDIRECT TESTS
test("vendor redirect", () => {
  expect(getRedirectPage("vendor"))
    .toBe("../vendor/vendor-dashboard.html");
});

test("student redirect", () => {
  expect(getRedirectPage("student"))
    .toBe("../student/student-dashboard.html");
});

test("admin redirect", () => {
  expect(getRedirectPage("admin"))
    .toBe("../adminControls/admin-controls.html");
});

test("unknown role", () => {
  expect(getRedirectPage("random")).toBe(null);
});


// 🔹 VENDOR STATUS TESTS
test("pending vendor", () => {
  expect(getVendorStatusMessage("pending")).toBe("waiting");
});

test("approved vendor", () => {
  expect(getVendorStatusMessage("approved")).toBe("approved");
});

test("suspended vendor", () => {
  expect(getVendorStatusMessage("suspended")).toBe("suspended");
});

test("unknown status", () => {
  expect(getVendorStatusMessage("anything")).toBe("unknown");
});