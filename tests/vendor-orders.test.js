import { isValidStatusTransition } from "../vendor/orders.js";

test("vendor status transitions allow received to preparing", () => {
  expect(isValidStatusTransition("received", "preparing")).toBe(true);
});

test("vendor status transitions allow preparing to ready", () => {
  expect(isValidStatusTransition("preparing", "ready")).toBe(true);
});

test("vendor status transitions allow ready to complete", () => {
  expect(isValidStatusTransition("ready", "complete")).toBe(true);
});

test("vendor status transitions prevent invalid jumps", () => {
  expect(isValidStatusTransition("received", "ready")).toBe(false);
  expect(isValidStatusTransition("preparing", "complete")).toBe(false);
  expect(isValidStatusTransition("ready", "preparing")).toBe(false);
});

test("vendor status transitions deny any change from complete", () => {
  expect(isValidStatusTransition("complete", "received")).toBe(false);
  expect(isValidStatusTransition("complete", "ready")).toBe(false);
});
