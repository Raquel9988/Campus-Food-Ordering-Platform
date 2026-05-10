const {
  isValidPaymentAmount,
  createPaymentReference,
  getOrderStatusAfterPayment,
  isSingleVendorCheckout,
} = require("../payments/paymentUtils.js");

test("payment amount must be greater than zero", () => {
  expect(isValidPaymentAmount(50)).toBe(true);
  expect(isValidPaymentAmount(0)).toBe(false);
  expect(isValidPaymentAmount(-20)).toBe(false);
});

test("payment amount must be a number", () => {
  expect(isValidPaymentAmount("50")).toBe(false);
  expect(isValidPaymentAmount(null)).toBe(false);
});

test("payment reference is created from order id", () => {
  expect(createPaymentReference(123)).toBe("ORDER-123");
});

test("payment reference returns null if order id is missing", () => {
  expect(createPaymentReference()).toBe(null);
});

test("successful payment changes order status to received", () => {
  expect(getOrderStatusAfterPayment("paid")).toBe("received");
});

test("failed payment changes order status to payment_failed", () => {
  expect(getOrderStatusAfterPayment("failed")).toBe("payment_failed");
});

test("pending or unknown payment keeps order as payment_pending", () => {
  expect(getOrderStatusAfterPayment("pending")).toBe("payment_pending");
  expect(getOrderStatusAfterPayment("unknown")).toBe("payment_pending");
});

test("checkout only allows items from one vendor", () => {
  const cartItems = [
    { name: "Burger", vendor_id: "vendor1" },
    { name: "Chips", vendor_id: "vendor1" },
  ];

  expect(isSingleVendorCheckout(cartItems)).toBe(true);
});

test("checkout blocks items from different vendors", () => {
  const cartItems = [
    { name: "Burger", vendor_id: "vendor1" },
    { name: "Pizza", vendor_id: "vendor2" },
  ];

  expect(isSingleVendorCheckout(cartItems)).toBe(false);
});

test("checkout is invalid if cart is empty", () => {
  expect(isSingleVendorCheckout([])).toBe(false);
});