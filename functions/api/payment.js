function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed. Use POST.",
      },
      405
    );
  }

  try {
    const body = await request.json();

    const { amount, orderReference, payerReference } = body;

    if (!amount || amount <= 0) {
      return jsonResponse(
        {
          success: false,
          message: "A valid payment amount is required.",
        },
        400
      );
    }

    if (!orderReference) {
      return jsonResponse(
        {
          success: false,
          message: "Order reference is required.",
        },
        400
      );
    }

    if (!payerReference) {
      return jsonResponse(
        {
          success: false,
          message: "Payer reference is required.",
        },
        400
      );
    }

    const transactionId = `TEST-${Date.now()}`;

    console.log("Payment request received:", {
      amount,
      orderReference,
      payerReference,
      transactionId,
      mode: "test",
    });

    return jsonResponse({
      success: true,
      status: "paid",
      message: "Mock payment processed successfully.",
      transactionId,
      amount,
      orderReference,
      payerReference,
      mode: "test",
    });
  } catch (error) {
    console.error("Payment API error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Invalid payment request.",
      },
      500
    );
  }
}