const { getRedirectPage } = require('../auth/loginUtils.js');

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

test("invalid role returns null", () => {
  expect(getRedirectPage("unknown")).toBe(null);
});