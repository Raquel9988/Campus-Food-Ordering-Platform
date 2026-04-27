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

function encodePayFastValue(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

async function createMd5Hash(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("MD5", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildPayFastSignatureString(paymentFields, passphrase) {
  const signatureParts = [];

  for (const [key, value] of Object.entries(paymentFields)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      signatureParts.push(`${key}=${encodePayFastValue(value)}`);
    }
  }

  if (passphrase && String(passphrase).trim() !== "") {
    signatureParts.push(`passphrase=${encodePayFastValue(passphrase)}`);
  }

  return signatureParts.join("&");
}

async function createPayFastSandboxPayment(paymentData, env) {
  const amount = Number(paymentData.amount).toFixed(2);

  const paymentFields = {
    merchant_id: env.PAYFAST_MERCHANT_ID,
    merchant_key: env.PAYFAST_MERCHANT_KEY,

    return_url: env.PAYFAST_RETURN_URL,
    cancel_url: env.PAYFAST_CANCEL_URL,
    notify_url: env.PAYFAST_NOTIFY_URL,

    m_payment_id: paymentData.orderReference,
    amount,

    item_name: `Campus Food Order ${paymentData.orderReference.slice(0, 8)}`,
    item_description: `Payment for campus food order ${paymentData.orderReference}`,

    custom_str1: paymentData.payerReference,
    custom_str2: paymentData.vendorReference,
    custom_str3: paymentData.orderReference,
  };

  const signatureString = buildPayFastSignatureString(
    paymentFields,
    env.PAYFAST_PASSPHRASE
  );

  const signature = await createMd5Hash(signatureString);

  return {
    success: true,
    status: "pending",
    message: "PayFast sandbox payment request created successfully.",
    paymentUrl: env.PAYFAST_PROCESS_URL,
    paymentFields: {
      ...paymentFields,
      signature,
    },
    mode: "payfast-sandbox",
  };
}

export async function onRequest(context) {
  const { request, env } = context;

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
    if (
      !env.PAYFAST_MERCHANT_ID ||
      !env.PAYFAST_MERCHANT_KEY ||
      !env.PAYFAST_PROCESS_URL ||
      !env.PAYFAST_RETURN_URL ||
      !env.PAYFAST_CANCEL_URL ||
      !env.PAYFAST_NOTIFY_URL
    ) {
      return jsonResponse(
        {
          success: false,
          message: "PayFast sandbox environment variables are missing.",
        },
        500
      );
    }

    const body = await request.json();

    const {
      amount,
      orderReference,
      payerReference,
      vendorReference,
    } = body;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
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

    if (!vendorReference) {
      return jsonResponse(
        {
          success: false,
          message: "Vendor reference is required.",
        },
        400
      );
    }

    const paymentResult = await createPayFastSandboxPayment(
      {
        amount: numericAmount,
        orderReference,
        payerReference,
        vendorReference,
      },
      env
    );

    console.log("PayFast sandbox payment request created:", {
      amount: numericAmount,
      orderReference,
      payerReference,
      vendorReference,
      status: paymentResult.status,
      mode: paymentResult.mode,
    });

    return jsonResponse(paymentResult);
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