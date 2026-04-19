// tests/orders.test.js

const { createOrder, splitOrdersByVendor } = require('../orders/orderUtils.js');

test("new order has default status 'received'", () => {
  const order = createOrder({ items: [1, 2] });
  expect(order.status).toBe("received");
});

test("order contains items", () => {
  const order = createOrder({ items: [1, 2] });
  expect(order.items.length).toBe(2);
});

test("split orders by vendor", () => {
  const cart = [
    { id: 1, vendor: "A" },
    { id: 2, vendor: "B" }
  ];

  const result = splitOrdersByVendor(cart);
  expect(result.length).toBe(2);
});

test("single vendor does not split", () => {
  const cart = [
    { id: 1, vendor: "A" },
    { id: 2, vendor: "A" }
  ];

  const result = splitOrdersByVendor(cart);
  expect(result.length).toBe(1);
});