import { afterEach, describe, expect, test, vi } from "vitest";
import { onRequest } from "../functions/api/analytics.js";

const validEnv = {
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

function createRequest(method = "GET") {
  return new Request("https://test.local/api/analytics", {
    method,
  });
}

async function callAnalyticsApi(env = validEnv, method = "GET") {
  const response = await onRequest({
    request: createRequest(method),
    env,
  });

  const data = await response.json();

  return {
    response,
    data,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analytics API", () => {
  test("returns only valid paid orders with clean analytics data", async () => {
    const paidOrder = {
      id: "order-1",
      student_id: "student-1",
      vendor_id: "vendor-1",
      status: "received",
      created_at: "2026-05-11T12:30:00.000Z",
      paid_at: "2026-05-11T12:31:00.000Z",
      payment_status: "paid",
      payment_provider: "payfast_sandbox",
      payment_amount: 65.5,
      transaction_id: "TXN-123",
      vendors: {
        id: "vendor-1",
        business_name: "Campus Café",
      },
      order_items: [
        {
          id: "item-row-1",
          menu_item_id: "menu-item-1",
          quantity: 2,
          price: 25,
          menu_items: {
            id: "menu-item-1",
            name: "Burger",
            price: 25,
          },
        },
        {
          id: "item-row-2",
          menu_item_id: "menu-item-2",
          quantity: 1,
          price: 15.5,
          menu_items: {
            id: "menu-item-2",
            name: "Juice",
            price: 15.5,
          },
        },
      ],
    };

    const unpaidOrder = {
      id: "order-2",
      vendor_id: "vendor-1",
      status: "payment_pending",
      created_at: "2026-05-11T13:00:00.000Z",
      payment_status: "unpaid",
      vendors: {
        business_name: "Campus Café",
      },
      order_items: [],
    };

    const failedPaidOrder = {
      id: "order-3",
      vendor_id: "vendor-2",
      status: "payment_failed",
      created_at: "2026-05-11T14:00:00.000Z",
      payment_status: "paid",
      vendors: {
        business_name: "Snack Shack",
      },
      order_items: [],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([paidOrder, unpaidOrder, failedPaidOrder]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    const { response, data } = await callAnalyticsApi();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);

    expect(data.data[0]).toMatchObject({
      order_id: "order-1",
      vendor_id: "vendor-1",
      vendor_name: "Campus Café",
      order_status: "received",
      payment_status: "paid",
      payment_provider: "payfast_sandbox",
      transaction_id: "TXN-123",
      created_at: "2026-05-11T12:30:00.000Z",
      paid_at: "2026-05-11T12:31:00.000Z",
      order_date: "2026-05-11",
      order_time: "12:30:00",
      order_total: 65.5,
      payment_amount: 65.5,
      item_count: 3,
    });

    expect(data.data[0].items).toEqual([
      {
        item_id: "menu-item-1",
        item_name: "Burger",
        quantity: 2,
        price: 25,
        line_total: 50,
      },
      {
        item_id: "menu-item-2",
        item_name: "Juice",
        quantity: 1,
        price: 15.5,
        line_total: 15.5,
      },
    ]);
  });

  test("calls Supabase with the service role key and paid order filter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    await callAnalyticsApi();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = globalThis.fetch.mock.calls[0];

    expect(url).toContain(`${validEnv.SUPABASE_URL}/rest/v1/orders`);
    expect(url).toContain("payment_status=eq.paid");

    expect(options.headers.apikey).toBe(validEnv.SUPABASE_SERVICE_ROLE_KEY);
    expect(options.headers.Authorization).toBe(
      `Bearer ${validEnv.SUPABASE_SERVICE_ROLE_KEY}`
    );
  });

  test("rejects non-GET requests", async () => {
    const { response, data } = await callAnalyticsApi(validEnv, "POST");

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Method not allowed. Use GET.");
  });

  test("returns server error when Supabase environment variables are missing", async () => {
    const { response, data } = await callAnalyticsApi({}, "GET");

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Server configuration error.");
  });

  test("returns error response when Supabase request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Database error", {
        status: 500,
      })
    );

    const { response, data } = await callAnalyticsApi();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Could not load analytics data.");
  });
});