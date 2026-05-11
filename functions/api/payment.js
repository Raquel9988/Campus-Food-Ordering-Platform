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

/* =========================
   PAYFAST HELPERS
========================= */

function cleanEnvValue(value) {
  return String(value || "").trim();
}

function encodePayFastValue(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

async function createMd5Hash(value) {
  try {
    const data = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("MD5", data);

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    const { createHash } = await import("node:crypto");

    return createHash("md5").update(value).digest("hex");
  }
}

function shouldUsePassphrase(passphrase) {
  const cleanPassphrase = cleanEnvValue(passphrase);

  if (!cleanPassphrase) return false;

  /*
    If Cloudflare forced you to enter something for PAYFAST_PASSPHRASE,
    these values should be treated as empty.
  */
  const ignoredValues = ["none", "null", "undefined", "blank", "empty"];

  return !ignoredValues.includes(cleanPassphrase.toLowerCase());
}

function buildPayFastSignatureString(paymentFields, passphrase) {
  const signatureParts = [];

  /*
    PayFast signature must be built from the same fields that are sent
    to PayFast, excluding the signature itself.
  */
  for (const [key, value] of Object.entries(paymentFields)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      signatureParts.push(`${key}=${encodePayFastValue(value)}`);
    }
  }

  if (shouldUsePassphrase(passphrase)) {
    signatureParts.push(`passphrase=${encodePayFastValue(passphrase)}`);
  }

  return signatureParts.join("&");
}

/* =========================
   CREATE PAYFAST PAYMENT
========================= */

async function createPayFastSandboxPayment(paymentData, env) {
  const amount = Number(paymentData.amount).toFixed(2);
  const orderReference = String(paymentData.orderReference);

  const paymentFields = {
    merchant_id: cleanEnvValue(env.PAYFAST_MERCHANT_ID),
    merchant_key: cleanEnvValue(env.PAYFAST_MERCHANT_KEY),

    return_url: cleanEnvValue(env.PAYFAST_RETURN_URL),
    cancel_url: cleanEnvValue(env.PAYFAST_CANCEL_URL),
    notify_url: cleanEnvValue(env.PAYFAST_NOTIFY_URL),

    m_payment_id: orderReference,
    amount,

    item_name: `Campus Food Order ${orderReference.slice(0, 8)}`,
    item_description: `Payment for campus food order ${orderReference}`,

    custom_str1: String(paymentData.payerReference),
    custom_str2: String(paymentData.vendorReference),
    custom_str3: orderReference,
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
    paymentUrl: cleanEnvValue(env.PAYFAST_PROCESS_URL),
    paymentFields: {
      ...paymentFields,
      signature,
    },
    mode: "payfast-sandbox",
  };
}

/* =========================
   API HANDLER
========================= */

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
      !cleanEnvValue(env.PAYFAST_MERCHANT_ID) ||
      !cleanEnvValue(env.PAYFAST_MERCHANT_KEY) ||
      !cleanEnvValue(env.PAYFAST_PROCESS_URL) ||
      !cleanEnvValue(env.PAYFAST_RETURN_URL) ||
      !cleanEnvValue(env.PAYFAST_CANCEL_URL) ||
      !cleanEnvValue(env.PAYFAST_NOTIFY_URL)
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

    const { amount, orderReference, payerReference, vendorReference } = body;

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
      passphraseUsed: shouldUsePassphrase(env.PAYFAST_PASSPHRASE),
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