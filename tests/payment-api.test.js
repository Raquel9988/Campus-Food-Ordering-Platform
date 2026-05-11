import { describe, test, expect } from "vitest";
import { onRequest } from "../functions/api/payment.js";

const validEnv = {
  PAYFAST_MERCHANT_ID: "10000100",
  PAYFAST_MERCHANT_KEY: "46f0cd694581a",
  PAYFAST_PROCESS_URL: "https://sandbox.payfast.co.za/eng/process",
  PAYFAST_RETURN_URL: "https://campus-food-ordering.pages.dev/payment-success.html",
  PAYFAST_CANCEL_URL: "https://campus-food-ordering.pages.dev/payment-cancelled.html",
  PAYFAST_NOTIFY_URL: "https://campus-food-ordering.pages.dev/api/payfast/notify",
  PAYFAST_PASSPHRASE: "",
};

function createRequest(body, method = "POST") {
  return new Request("https://test.local/api/payment", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

async function callPaymentApi(body, env = validEnv, method = "POST") {
  const request = createRequest(body, method);

  const response = await onRequest({
    request,
    env,
  });

  const data = await response.json();

  return {
    response,
    data,
  };
}

describe("actual PayFast payment API", () => {
  test("creates a PayFast sandbox payment request when valid data is sent", async () => {
    const { response, data } = await callPaymentApi({
      amount: 50,
      orderReference: "ORDER-123",
      payerReference: "student-1",
      vendorReference: "vendor-1",
    });

    expect(response.status).toBe(200);

    expect(data.success).toBe(true);
    expect(data.status).toBe("pending");
    expect(data.mode).toBe("payfast-sandbox");
    expect(data.paymentUrl).toBe(validEnv.PAYFAST_PROCESS_URL);

    expect(data.paymentFields.merchant_id).toBe(validEnv.PAYFAST_MERCHANT_ID);
    expect(data.paymentFields.merchant_key).toBe(validEnv.PAYFAST_MERCHANT_KEY);

    expect(data.paymentFields.return_url).toBe(validEnv.PAYFAST_RETURN_URL);
    expect(data.paymentFields.cancel_url).toBe(validEnv.PAYFAST_CANCEL_URL);
    expect(data.paymentFields.notify_url).toBe(validEnv.PAYFAST_NOTIFY_URL);

    expect(data.paymentFields.amount).toBe("50.00");
    expect(data.paymentFields.m_payment_id).toBe("ORDER-123");

    expect(data.paymentFields.custom_str1).toBe("student-1");
    expect(data.paymentFields.custom_str2).toBe("vendor-1");
    expect(data.paymentFields.custom_str3).toBe("ORDER-123");

    expect(data.paymentFields.item_name).toContain("Campus Food Order");
    expect(data.paymentFields.item_description).toContain("ORDER-123");

    expect(data.paymentFields.signature).toMatch(/^[a-f0-9]{32}$/);
  });

  test("formats decimal payment amount to two decimal places", async () => {
    const { response, data } = await callPaymentApi({
      amount: 75.5,
      orderReference: "ORDER-456",
      payerReference: "student-2",
      vendorReference: "vendor-2",
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.paymentFields.amount).toBe("75.50");
  });

  test("rejects payment when amount is zero", async () => {
    const { response, data } = await callPaymentApi({
      amount: 0,
      orderReference: "ORDER-123",
      payerReference: "student-1",
      vendorReference: "vendor-1",
    });

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("A valid payment amount is required.");
  });

  test("rejects payment when amount is negative", async () => {
    const { response, data } = await callPaymentApi({
      amount: -20,
      orderReference: "ORDER-123",
      payerReference: "student-1",
      vendorReference: "vendor-1",
    });

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("A valid payment amount is required.");
  });

  test("rejects payment when order reference is missing", async () => {
    const { response, data } = await callPaymentApi({
      amount: 50,
      payerReference: "student-1",
      vendorReference: "vendor-1",
    });

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Order reference is required.");
  });

  test("rejects payment when payer reference is missing", async () => {
    const { response, data } = await callPaymentApi({
      amount: 50,
      orderReference: "ORDER-123",
      vendorReference: "vendor-1",
    });

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Payer reference is required.");
  });

  test("rejects payment when vendor reference is missing", async () => {
    const { response, data } = await callPaymentApi({
      amount: 50,
      orderReference: "ORDER-123",
      payerReference: "student-1",
    });

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Vendor reference is required.");
  });

  test("rejects request when PayFast environment variables are missing", async () => {
    const brokenEnv = {
      ...validEnv,
      PAYFAST_MERCHANT_ID: "",
    };

    const { response, data } = await callPaymentApi(
      {
        amount: 50,
        orderReference: "ORDER-123",
        payerReference: "student-1",
        vendorReference: "vendor-1",
      },
      brokenEnv
    );

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("PayFast sandbox environment variables are missing.");
  });

  test("rejects GET requests because payment API only allows POST", async () => {
    const { response, data } = await callPaymentApi({}, validEnv, "GET");

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Method not allowed. Use POST.");
  });

  test("allows OPTIONS request for CORS preflight", async () => {
    const { response, data } = await callPaymentApi({}, validEnv, "OPTIONS");

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  test("returns invalid payment request when invalid JSON is sent", async () => {
    const request = new Request("https://test.local/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{ invalid json",
    });

    const response = await onRequest({
      request,
      env: validEnv,
    });

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid payment request.");
  });
});