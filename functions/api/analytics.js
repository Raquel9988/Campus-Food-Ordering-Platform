function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/* =========================
   ANALYTICS HELPERS
========================= */

const VALID_ORDER_STATUSES = ["received", "preparing", "ready", "complete"];

function isValidPaidOrder(order) {
  return (
    order &&
    order.payment_status === "paid" &&
    VALID_ORDER_STATUSES.includes(order.status)
  );
}

function safeNumber(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function calculateOrderTotal(orderItems) {
  if (!Array.isArray(orderItems)) {
    return 0;
  }

  return orderItems.reduce((total, item) => {
    const quantity = safeNumber(item.quantity);
    const price = safeNumber(item.price);

    return total + quantity * price;
  }, 0);
}

function getOrderDate(createdAt) {
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt).toISOString().split("T")[0];
}

function getOrderTime(createdAt) {
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt).toISOString().split("T")[1].slice(0, 8);
}

function getOrderHour(createdAt) {
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt).getHours();
}

function prepareAnalyticsOrder(order) {
  const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
  const calculatedTotal = calculateOrderTotal(orderItems);

  return {
    order_id: order.id,
    vendor_id: order.vendor_id,
    vendor_name: order.vendors?.business_name || "Unknown Vendor",

    order_status: order.status,
    payment_status: order.payment_status,
    payment_provider: order.payment_provider || null,
    transaction_id: order.transaction_id || null,

    created_at: order.created_at,
    paid_at: order.paid_at || null,
    order_date: getOrderDate(order.created_at),
    order_time: getOrderTime(order.created_at),
    order_hour: getOrderHour(order.created_at),

    order_total: calculatedTotal,
    payment_amount: order.payment_amount ? safeNumber(order.payment_amount) : null,

    item_count: orderItems.reduce((total, item) => {
      return total + safeNumber(item.quantity);
    }, 0),

    items: orderItems.map((item) => {
      return {
        item_id: item.menu_item_id,
        item_name: item.menu_items?.name || "Unknown Item",
        quantity: safeNumber(item.quantity),
        price: safeNumber(item.price),
        line_total: safeNumber(item.quantity) * safeNumber(item.price),
      };
    }),
  };
}

async function fetchPaidOrdersFromSupabase(env) {
  const selectQuery = [
    "id",
    "student_id",
    "vendor_id",
    "status",
    "created_at",
    "paid_at",
    "payment_status",
    "payment_provider",
    "payment_amount",
    "transaction_id",
    "vendors(id,business_name)",
    "order_items(id,menu_item_id,quantity,price,menu_items(id,name,price))",
  ].join(",");

  const url =
    `${env.SUPABASE_URL}/rest/v1/orders` +
    `?select=${encodeURIComponent(selectQuery)}` +
    `&payment_status=eq.paid` +
    `&order=created_at.desc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not fetch analytics data: ${errorText}`);
  }

  return response.json();
}

/* =========================
   API HANDLER
========================= */

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "GET") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed. Use GET.",
      },
      405
    );
  }

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables.");

      return jsonResponse(
        {
          success: false,
          message: "Server configuration error.",
        },
        500
      );
    }

    const orders = await fetchPaidOrdersFromSupabase(env);

    const analyticsOrders = orders
      .filter(isValidPaidOrder)
      .map(prepareAnalyticsOrder);

    return jsonResponse({
      success: true,
      message: "Analytics data loaded successfully.",
      count: analyticsOrders.length,
      data: analyticsOrders,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Could not load analytics data.",
      },
      500
    );
  }
}