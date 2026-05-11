import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { onRequest } from "../functions/api/payfast/notify.js";

const validEnv = {
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

function createPayFastNotifyRequest(formFields, method = "POST") {
  const formData = new FormData();

  for (const [key, value] of Object.entries(formFields)) {
    formData.append(key, value);
  }

  return new Request("https://test.local/api/payfast/notify", {
    method,
    body: method === "POST" ? formData : undefined,
  });
}

async function callNotifyApi(formFields, env = validEnv, method = "POST") {
  const request = createPayFastNotifyRequest(formFields, method);

  const response = await onRequest({
    request,
    env,
  });

  const text = await response.text();

  return {
    response,
    text,
  };
}

describe("actual PayFast notify API", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify([
            {
              id: "ORDER-123",
            },
          ]),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("allows OPTIONS request for CORS preflight", async () => {
    const { response, text } = await callNotifyApi({}, validEnv, "OPTIONS");

    expect(response.status).toBe(200);
    expect(text).toBe("OK");

    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS"
    );
  });

  test("rejects GET requests because notify API only allows POST", async () => {
    const { response, text } = await callNotifyApi({}, validEnv, "GET");

    expect(response.status).toBe(405);
    expect(text).toBe("Method not allowed");
  });

  test("returns server error when Supabase environment variables are missing", async () => {
    const brokenEnv = {
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    };

    const { response, text } = await callNotifyApi(
      {
        m_payment_id: "ORDER-123",
        payment_status: "COMPLETE",
        pf_payment_id: "PF-999",
        amount_gross: "50.00",
      },
      brokenEnv
    );

    expect(response.status).toBe(500);
    expect(text).toBe("Server configuration error");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("returns bad request when PayFast notify has no order reference", async () => {
    const { response, text } = await callNotifyApi({
      payment_status: "COMPLETE",
      pf_payment_id: "PF-999",
      amount_gross: "50.00",
    });

    expect(response.status).toBe(400);
    expect(text).toBe("Missing order reference");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("marks order as paid and received when PayFast payment is COMPLETE", async () => {
    const { response, text } = await callNotifyApi({
      m_payment_id: "ORDER-123",
      payment_status: "COMPLETE",
      pf_payment_id: "PF-999",
      amount_gross: "50.00",
    });

    expect(response.status).toBe(200);
    expect(text).toBe("OK");

    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe(
      "https://test-project.supabase.co/rest/v1/orders?id=eq.ORDER-123"
    );

    expect(options.method).toBe("PATCH");
    expect(options.headers.apikey).toBe(validEnv.SUPABASE_SERVICE_ROLE_KEY);
    expect(options.headers.Authorization).toBe(
      `Bearer ${validEnv.SUPABASE_SERVICE_ROLE_KEY}`
    );
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Prefer).toBe("return=representation");

    const updateData = JSON.parse(options.body);

    expect(updateData.status).toBe("received");
    expect(updateData.payment_status).toBe("paid");
    expect(updateData.payment_provider).toBe("payfast_sandbox");
    expect(updateData.transaction_id).toBe("PF-999");
    expect(updateData.payment_amount).toBe(50);

    expect(typeof updateData.paid_at).toBe("string");
    expect(Number.isNaN(Date.parse(updateData.paid_at))).toBe(false);
  });

  test("marks order as payment_failed when PayFast payment is not COMPLETE", async () => {
    const { response, text } = await callNotifyApi({
      m_payment_id: "ORDER-456",
      payment_status: "FAILED",
      pf_payment_id: "PF-888",
      amount_gross: "25.00",
    });

    expect(response.status).toBe(200);
    expect(text).toBe("OK");

    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe(
      "https://test-project.supabase.co/rest/v1/orders?id=eq.ORDER-456"
    );

    expect(options.method).toBe("PATCH");

    const updateData = JSON.parse(options.body);

    expect(updateData.status).toBe("payment_failed");
    expect(updateData.payment_status).toBe("failed");
    expect(updateData.payment_provider).toBe("payfast_sandbox");
    expect(updateData.transaction_id).toBe("PF-888");
    expect(updateData.payment_amount).toBeUndefined();
    expect(updateData.paid_at).toBeUndefined();
  });

  test("uses null transaction id when PayFast payment id is missing", async () => {
    const { response, text } = await callNotifyApi({
      m_payment_id: "ORDER-789",
      payment_status: "COMPLETE",
      amount_gross: "100.00",
    });

    expect(response.status).toBe(200);
    expect(text).toBe("OK");

    const [, options] = fetch.mock.calls[0];
    const updateData = JSON.parse(options.body);

    expect(updateData.transaction_id).toBe(null);
  });

  test("returns handler error when Supabase update fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response("Supabase update failed", {
          status: 500,
        });
      })
    );

    const { response, text } = await callNotifyApi({
      m_payment_id: "ORDER-123",
      payment_status: "COMPLETE",
      pf_payment_id: "PF-999",
      amount_gross: "50.00",
    });

    expect(response.status).toBe(500);
    expect(text).toBe("Notify handler error");
  });

  test("encodes the order id before sending it to Supabase", async () => {
    const { response, text } = await callNotifyApi({
      m_payment_id: "ORDER 123/ABC",
      payment_status: "COMPLETE",
      pf_payment_id: "PF-999",
      amount_gross: "50.00",
    });

    expect(response.status).toBe(200);
    expect(text).toBe("OK");

    const [url] = fetch.mock.calls[0];

    expect(url).toBe(
      "https://test-project.supabase.co/rest/v1/orders?id=eq.ORDER%20123%2FABC"
    );
  });
});