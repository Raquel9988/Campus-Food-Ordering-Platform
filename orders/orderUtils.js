function createOrder(data) {
  return {
    items: data.items || [],
    status: "received"
  };
}

function splitOrdersByVendor(cart) {
  const map = {};

  cart.forEach(item => {
    if (!map[item.vendor]) {
      map[item.vendor] = [];
    }
    map[item.vendor].push(item);
  });

  return Object.values(map);
}

module.exports = {
  createOrder,
  splitOrdersByVendor
};