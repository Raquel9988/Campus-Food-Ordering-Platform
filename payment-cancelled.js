import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const message = document.getElementById("payment-cancelled-text");

function setMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

function clearPendingPaymentStorage() {
  sessionStorage.removeItem("campus_pending_order_id");
  sessionStorage.removeItem("campus_pending_cart_key");
}

async function markPaymentAsCancelled() {
  const pendingOrderId = sessionStorage.getItem("campus_pending_order_id");

  if (!pendingOrderId) {
    setMessage("You can return to your cart and try again.");
    return;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", pendingOrderId)
    .eq("payment_status", "pending")
    .select("id, status, payment_status")
    .maybeSingle();

  if (error) {
    console.error("Cancel payment update error:", error);

    setMessage(
      "Payment was cancelled. Your cart has not been cleared, so you can try again."
    );

    return;
  }

  clearPendingPaymentStorage();

  if (!data) {
    setMessage(
      "Payment was cancelled. Your cart has not been cleared, so you can try again."
    );

    return;
  }

  setMessage("Payment was cancelled. Your cart is still saved.");
}

window.addEventListener("load", markPaymentAsCancelled);
