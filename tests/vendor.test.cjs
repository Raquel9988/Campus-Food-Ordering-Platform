const { getVendorStatusMessage } = require('../auth/loginUtils.js');

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
  expect(getVendorStatusMessage("other")).toBe("unknown");
});