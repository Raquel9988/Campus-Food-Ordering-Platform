// tests/status.test.js

const { canUpdateStatus } = require('../orders/statusUtils.js');

test("valid transition: received → preparing", () => {
  expect(canUpdateStatus("received", "preparing")).toBe(true);
});

test("valid transition: preparing → ready", () => {
  expect(canUpdateStatus("preparing", "ready")).toBe(true);
});

test("cannot skip to ready", () => {
  expect(canUpdateStatus("received", "ready")).toBe(false);
});

test("cannot go backwards", () => {
  expect(canUpdateStatus("ready", "preparing")).toBe(false);
});

test("invalid status returns false", () => {
  expect(canUpdateStatus("unknown", "ready")).toBe(false);
});