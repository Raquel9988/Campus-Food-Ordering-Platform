function isValidPaymentAmount(amount) {
  return typeof amount === "number" && amount > 0;
}

function createPaymentReference(orderId) {
  if (!orderId) {
    return null;
  }

  return `ORDER-${orderId}`;
}

function getOrderStatusAfterPayment(paymentStatus) {
  if (paymentStatus === "paid") {
    return "received";
  }

  if (paymentStatus === "failed") {
    return "payment_failed";
  }

  return "payment_pending";
}

function isSingleVendorCheckout(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return false;
  }

  const firstVendorId = cartItems[0].vendor_id;

  return cartItems.every((item) => item.vendor_id === firstVendorId);
}

module.exports = {
  isValidPaymentAmount,
  createPaymentReference,
  getOrderStatusAfterPayment,
  isSingleVendorCheckout,
};