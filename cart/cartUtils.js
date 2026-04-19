function addToCart(cart, item) {
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  return cart;
}

function updateQuantity(cart, id, qty) {
  return cart.map(item =>
    item.id === id ? { ...item, qty } : item
  );
}

function removeFromCart(cart, id) {
  return cart.filter(item => item.id !== id);
}

function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

module.exports = {
  addToCart,
  updateQuantity,
  removeFromCart,
  calculateTotal
};