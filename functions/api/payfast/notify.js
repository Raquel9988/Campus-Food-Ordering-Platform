function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function formDataToObject(formData) {
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

async function updateOrderPayment(orderId, updateData, env) {
  const encodedOrderId = encodeURIComponent(orderId);

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/orders?id=eq.${encodedOrderId}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not update order: ${errorText}`);
  }

  return response.json();
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return textResponse("OK");
  }

  if (request.method !== "POST") {
    return textResponse("Method not allowed", 405);
  }

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables.");
      return textResponse("Server configuration error", 500);
    }

    const formData = await request.formData();
    const payfastData = formDataToObject(formData);

    console.log("PayFast notify received:", payfastData);

    const orderId = payfastData.m_payment_id;
    const paymentStatus = payfastData.payment_status;
    const payfastPaymentId = payfastData.pf_payment_id;
    const paidAmount = payfastData.amount_gross
      ? Number(payfastData.amount_gross)
      : null;

    if (!orderId) {
      console.error("Missing m_payment_id from PayFast notify.");
      return textResponse("Missing order reference", 400);
    }

    if (paymentStatus === "COMPLETE") {
      await updateOrderPayment(
        orderId,
        {
          status: "received",
          payment_status: "paid",
          payment_provider: "payfast_sandbox",
          transaction_id: payfastPaymentId || null,
          paid_at: new Date().toISOString(),
          ...(paidAmount ? { payment_amount: paidAmount } : {}),
        },
        env
      );

      console.log("Order marked as paid and received:", {
        orderId,
        paymentStatus,
        payfastPaymentId,
        paidAmount,
      });

      return textResponse("OK");
    }

    await updateOrderPayment(
      orderId,
      {
        status: "payment_failed",
        payment_status: "failed",
        payment_provider: "payfast_sandbox",
        transaction_id: payfastPaymentId || null,
      },
      env
    );

    console.log("Order marked as payment_failed:", {
      orderId,
      paymentStatus,
      payfastPaymentId,
    });

    return textResponse("OK");
  } catch (error) {
    console.error("PayFast notify error:", error);
    return textResponse("Notify handler error", 500);
  }
}