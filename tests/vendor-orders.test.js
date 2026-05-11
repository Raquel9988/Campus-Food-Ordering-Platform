import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();

  document.body.innerHTML = `
    <section id="loading-container" class="hidden"></section>
    <section id="error-container" class="hidden"></section>
    <p id="error-text"></p>
    <section id="orders-container" class="hidden"></section>
    <section id="empty-state" class="hidden"></section>

    <button id="refresh-btn" type="button">Refresh</button>
    <button id="retry-btn" type="button">Retry</button>
    <button id="dashboard-btn" type="button">Dashboard</button>
  `;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.restoreAllMocks();
  vi.resetModules();

  document.body.innerHTML = "";
});

describe("vendor order status transitions", () => {
  test("vendor status transitions allow received to preparing", async () => {
    const { isValidStatusTransition } = await import("../vendor/orders.js");

    expect(isValidStatusTransition("received", "preparing")).toBe(true);
  });

  test("vendor status transitions allow preparing to ready", async () => {
    const { isValidStatusTransition } = await import("../vendor/orders.js");

    expect(isValidStatusTransition("preparing", "ready")).toBe(true);
  });

  test("vendor status transitions allow ready to complete", async () => {
    const { isValidStatusTransition } = await import("../vendor/orders.js");

    expect(isValidStatusTransition("ready", "complete")).toBe(true);
  });

  test("vendor status transitions prevent invalid jumps", async () => {
    const { isValidStatusTransition } = await import("../vendor/orders.js");

    expect(isValidStatusTransition("received", "ready")).toBe(false);
    expect(isValidStatusTransition("received", "complete")).toBe(false);
    expect(isValidStatusTransition("preparing", "complete")).toBe(false);
    expect(isValidStatusTransition("ready", "preparing")).toBe(false);
  });

  test("vendor status transitions deny any change from complete", async () => {
    const { isValidStatusTransition } = await import("../vendor/orders.js");

    expect(isValidStatusTransition("complete", "received")).toBe(false);
    expect(isValidStatusTransition("complete", "preparing")).toBe(false);
    expect(isValidStatusTransition("complete", "ready")).toBe(false);
  });
});

describe("vendor order formatting", () => {
  test("currency is formatted with rand symbol and two decimals", async () => {
    const { formatCurrency } = await import("../vendor/orders.js");

    expect(formatCurrency(50)).toBe("R50.00");
    expect(formatCurrency(25.5)).toBe("R25.50");
    expect(formatCurrency(null)).toBe("R0.00");
  });

  test("missing date is shown as N/A", async () => {
    const { formatDate } = await import("../vendor/orders.js");

    expect(formatDate(null)).toBe("N/A");
    expect(formatDate("")).toBe("N/A");
  });

  test("unsafe HTML is escaped", async () => {
    const { escapeHtml } = await import("../vendor/orders.js");

    expect(escapeHtml("<script>bad</script>")).toBe(
      "&lt;script&gt;bad&lt;/script&gt;"
    );

    expect(escapeHtml("Fish & Chips")).toBe("Fish &amp; Chips");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(escapeHtml("it's nice")).toBe("it&#039;s nice");
  });
});

describe("vendor order cards", () => {
  test("received order card shows Start Preparing button", async () => {
    const { createOrderCard } = await import("../vendor/orders.js");

    const card = createOrderCard({
      id: "order-12345678",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-001",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 50,
      items: [
        {
          name: "Burger",
          quantity: 2,
          price: 25,
        },
      ],
    });

    expect(card.textContent).toContain("Order #order-12");
    expect(card.textContent).toContain("received");
    expect(card.textContent).toContain("Payment Received");
    expect(card.textContent).toContain("PayFast");
    expect(card.textContent).toContain("TX-001");
    expect(card.textContent).toContain("student@example.com");
    expect(card.textContent).toContain("Burger");
    expect(card.textContent).toContain("R25.00");
    expect(card.textContent).toContain("R50.00");
    expect(card.textContent).toContain("Start Preparing");
  });

  test("preparing order card shows Mark as Ready button", async () => {
    const { createOrderCard } = await import("../vendor/orders.js");

    const card = createOrderCard({
      id: "order-22222222",
      status: "preparing",
      payment_provider: "PayFast",
      transaction_id: "TX-002",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 30,
      items: [
        {
          name: "Wrap",
          quantity: 1,
          price: 30,
        },
      ],
    });

    expect(card.textContent).toContain("preparing");
    expect(card.textContent).toContain("Mark as Ready");
    expect(card.textContent).not.toContain("Start Preparing");
    expect(card.textContent).not.toContain("Order Complete");
  });

  test("ready order card shows Order Complete button", async () => {
    const { createOrderCard } = await import("../vendor/orders.js");

    const card = createOrderCard({
      id: "order-33333333",
      status: "ready",
      payment_provider: "PayFast",
      transaction_id: "TX-003",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 40,
      items: [
        {
          name: "Pizza",
          quantity: 1,
          price: 40,
        },
      ],
    });

    expect(card.textContent).toContain("ready");
    expect(card.textContent).toContain("Order Complete");
    expect(card.textContent).not.toContain("Start Preparing");
    expect(card.textContent).not.toContain("Mark as Ready");
  });

  test("order card shows no items found when items list is empty", async () => {
    const { createOrderCard } = await import("../vendor/orders.js");

    const card = createOrderCard({
      id: "order-44444444",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-004",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 0,
      items: [],
    });

    expect(card.textContent).toContain("No items found.");
    expect(card.textContent).toContain("R0.00");
  });

  test("order card escapes unsafe HTML in displayed text", async () => {
    const { createOrderCard } = await import("../vendor/orders.js");

    const card = createOrderCard({
      id: "order-55555555",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-005",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "<script>alert('bad')</script>",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 20,
      items: [
        {
          name: "<img src=x onerror=alert(1)>",
          quantity: 1,
          price: 20,
        },
      ],
    });

    expect(card.innerHTML).not.toContain("<script>");
    expect(card.innerHTML).not.toContain("<img src=x");
    expect(card.innerHTML).toContain("&lt;script&gt;");
    expect(card.innerHTML).toContain("&lt;img");
  });
});

describe("vendor order rendering", () => {
  test("renderOrders shows empty state when there are no orders", async () => {
    const { renderOrders } = await import("../vendor/orders.js");

    renderOrders([]);

    const emptyState = document.getElementById("empty-state");
    const ordersContainer = document.getElementById("orders-container");

    expect(emptyState.classList.contains("hidden")).toBe(false);
    expect(ordersContainer.classList.contains("hidden")).toBe(true);
  });

  test("renderOrders displays received and preparing orders under Active Orders", async () => {
    const { renderOrders } = await import("../vendor/orders.js");

    renderOrders([
      {
        id: "order-11111111",
        status: "received",
        payment_provider: "PayFast",
        transaction_id: "TX-111",
        paid_at: "2026-05-11T10:00:00Z",
        studentEmail: "student1@example.com",
        created_at: "2026-05-11T09:50:00Z",
        total_price: 50,
        items: [
          {
            name: "Burger",
            quantity: 2,
            price: 25,
          },
        ],
      },
      {
        id: "order-22222222",
        status: "preparing",
        payment_provider: "PayFast",
        transaction_id: "TX-222",
        paid_at: "2026-05-11T10:05:00Z",
        studentEmail: "student2@example.com",
        created_at: "2026-05-11T10:01:00Z",
        total_price: 30,
        items: [
          {
            name: "Wrap",
            quantity: 1,
            price: 30,
          },
        ],
      },
    ]);

    const ordersContainer = document.getElementById("orders-container");

    expect(ordersContainer.textContent).toContain("Active Orders");
    expect(ordersContainer.textContent).toContain("student1@example.com");
    expect(ordersContainer.textContent).toContain("student2@example.com");
    expect(ordersContainer.textContent).toContain("Start Preparing");
    expect(ordersContainer.textContent).toContain("Mark as Ready");
  });

  test("renderOrders displays ready orders under Ready for Pickup", async () => {
    const { renderOrders } = await import("../vendor/orders.js");

    renderOrders([
      {
        id: "order-33333333",
        status: "ready",
        payment_provider: "PayFast",
        transaction_id: "TX-333",
        paid_at: "2026-05-11T10:10:00Z",
        studentEmail: "student3@example.com",
        created_at: "2026-05-11T10:02:00Z",
        total_price: 40,
        items: [
          {
            name: "Pizza",
            quantity: 1,
            price: 40,
          },
        ],
      },
    ]);

    const ordersContainer = document.getElementById("orders-container");

    expect(ordersContainer.textContent).toContain("Ready for Pickup");
    expect(ordersContainer.textContent).toContain("student3@example.com");
    expect(ordersContainer.textContent).toContain("Order Complete");
  });
});

describe("vendor page display states", () => {
  test("showLoading displays loading and hides the other sections", async () => {
    const { showLoading } = await import("../vendor/orders.js");

    showLoading();

    expect(
      document.getElementById("loading-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(true);
  });

  test("showError displays the error message", async () => {
    const { showError } = await import("../vendor/orders.js");

    showError("Something went wrong");

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("loading-container").classList.contains("hidden")
    ).toBe(true);

    expect(document.getElementById("error-text").textContent).toBe(
      "Something went wrong"
    );
  });

  test("showOrders displays orders container and hides empty state", async () => {
    const { showOrders } = await import("../vendor/orders.js");

    showOrders();

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);
  });

  test("showEmpty displays the empty state", async () => {
    const { showEmpty } = await import("../vendor/orders.js");

    showEmpty();

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);
  });
});