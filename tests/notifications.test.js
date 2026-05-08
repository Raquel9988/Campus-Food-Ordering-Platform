// tests/notifications.test.js

const { shouldNotify } = require('../realtime/notificationUtils.js');

test("ready status triggers notification", () => {
  expect(shouldNotify("ready")).toBe(true);
});

test("received does not trigger notification", () => {
  expect(shouldNotify("received")).toBe(false);
});

test("preparing does not trigger notification", () => {
  expect(shouldNotify("preparing")).toBe(false);
});