import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const statusText = document.getElementById("payment-status-text");
const activeOrdersBtn = document.getElementById("active-orders-btn");
const dashboardBtn = document.getElementById("dashboard-btn");

function setMessage(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function clearCartByKey(cartKey) {
  if (cartKey) {
    localStorage.removeItem(cartKey);
  }
}

function clearPendingPaymentStorage() {
  sessionStorage.removeItem("campus_pending_order_id");
  sessionStorage.removeItem("campus_pending_cart_key");
}

function isSuccessfulPaidOrder(order) {
  if (!order) {
    return false;
  }

  const successfulStatuses = ["received", "preparing", "ready", "complete"];

  return (
    order.payment_status === "paid" &&
    successfulStatuses.includes(order.status)
  );
}

async function getPendingOrder() {
  const pendingOrderId = sessionStorage.getItem("campus_pending_order_id");

  if (!pendingOrderId) {
    return null;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", pendingOrderId)
    .maybeSingle();

  if (error) {
    console.error("Payment success check error:", error);
    return null;
  }

  return order;
}

async function confirmPaymentAndClearCart() {
  const pendingCartKey = sessionStorage.getItem("campus_pending_cart_key");

  if (!pendingCartKey) {
    setMessage("Payment completed. Redirecting to your active orders...");

    setTimeout(() => {
      window.location.href = "student/my-orders.html?filter=active";
    }, 1500);

    return;
  }

  setMessage("Confirming your payment and clearing your cart...");

  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const order = await getPendingOrder();

    if (isSuccessfulPaidOrder(order)) {
      clearCartByKey(pendingCartKey);
      clearPendingPaymentStorage();

      setMessage("Payment successful. Your cart has been cleared.");

      setTimeout(() => {
        window.location.href = "student/my-orders.html?filter=active";
      }, 1500);

      return;
    }

    if (
      order?.payment_status === "failed" ||
      order?.payment_status === "cancelled" ||
      order?.status === "payment_failed" ||
      order?.status === "cancelled"
    ) {
      clearPendingPaymentStorage();

      setMessage(
        "Payment was not successful, so your cart has not been cleared."
      );

      return;
    }

    attempts += 1;

    await new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });
  }

  setMessage(
    "Payment is still being confirmed. Please check your Active Orders shortly. Your cart will not be cleared until payment is confirmed."
  );
}

activeOrdersBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "student/my-orders.html?filter=active";
});

dashboardBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "student/student-dashboard.html";
});

window.addEventListener("load", confirmPaymentAndClearCart);
