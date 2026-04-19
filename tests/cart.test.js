// tests/cart.test.js

const { addToCart, updateQuantity, removeFromCart, calculateTotal } = require('../cart/cartUtils.js');

test("adding item increases cart size", () => {
  const cart = [];
  const result = addToCart(cart, { id: 1, price: 10 });
  expect(result.length).toBe(1);
});

test("adding same item increases quantity", () => {
  const cart = [{ id: 1, price: 10, qty: 1 }];
  const result = addToCart(cart, { id: 1, price: 10 });
  expect(result[0].qty).toBe(2);
});

test("update quantity works", () => {
  const cart = [{ id: 1, qty: 1 }];
  const result = updateQuantity(cart, 1, 3);
  expect(result[0].qty).toBe(3);
});

test("remove item from cart", () => {
  const cart = [{ id: 1 }];
  const result = removeFromCart(cart, 1);
  expect(result.length).toBe(0);
});

test("calculate total price", () => {
  const cart = [
    { price: 10, qty: 2 },
    { price: 5, qty: 1 }
  ];
  expect(calculateTotal(cart)).toBe(25);
});