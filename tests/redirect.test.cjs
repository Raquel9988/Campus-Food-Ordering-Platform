const { getRedirectPath } = require('../auth/redirectUtils.js');

test("vendor approved", () => {
  expect(getRedirectPath("vendor", "approved"))
    .toBe("../vendor/vendor-dashboard.html");
});

test("vendor pending", () => {
  expect(getRedirectPath("vendor", "pending"))
    .toBe("PENDING");
});

test("vendor suspended", () => {
  expect(getRedirectPath("vendor", "suspended"))
    .toBe("SUSPENDED");
});

test("student redirect", () => {
  expect(getRedirectPath("student"))
    .toBe("../student/student-dashboard.html");
});

test("admin redirect", () => {
  expect(getRedirectPath("admin"))
    .toBe("../adminControls/admin-controls.html");
});