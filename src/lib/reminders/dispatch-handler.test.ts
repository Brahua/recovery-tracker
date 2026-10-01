import { describe, expect, it, vi } from "vitest";

import type { DispatchStore } from "@/lib/reminders/dispatch";
import { createDispatchHandler, isAuthorizedDispatch } from "@/lib/reminders/dispatch-handler";

const emptyStore: DispatchStore = {
  listActiveSettings: async () => [],
  usersWithSessionOn: async () => new Set(),
  usersWithCloseoutOn: async () => new Set(),
  deliveriesOn: async () => new Map(),
  subscriptionsFor: async () => new Map(),
  reserveDelivery: async () => true,
  deleteSubscription: async () => {},
  markSubscriptionSuccess: async () => {},
};

const request = (authorization?: string) =>
  new Request("https://app.test/api/reminders/dispatch", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

const handler = (overrides: Partial<Parameters<typeof createDispatchHandler>[0]> = {}) =>
  createDispatchHandler({
    secret: "s3cret",
    getSender: () => vi.fn(async () => ({ status: "sent" as const })),
    getStore: () => emptyStore,
    ...overrides,
  });

describe("isAuthorizedDispatch", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedDispatch("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorizedDispatch("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorizedDispatch("Bearer s3cret-and-more", "s3cret")).toBe(false);
    expect(isAuthorizedDispatch("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedDispatch(null, "s3cret")).toBe(false);
  });
});

describe("createDispatchHandler", () => {
  it("rejects missing or wrong secrets with 401 and no data", async () => {
    for (const auth of [undefined, "Bearer nope"]) {
      const response = await handler()(request(auth));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized." });
    }
  });

  it("answers 503 while the server is not configured", async () => {
    expect((await handler({ secret: undefined })(request("Bearer s3cret"))).status).toBe(503);
    expect((await handler({ getSender: () => null })(request("Bearer s3cret"))).status).toBe(503);
    expect((await handler({ getStore: () => null })(request("Bearer s3cret"))).status).toBe(503);
  });

  it("returns only counters after dispatching", async () => {
    const response = await handler()(request("Bearer s3cret"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      candidates: 0,
      remindersSent: 0,
      notificationsSent: 0,
      subscriptionsRemoved: 0,
      failures: 0,
    });
  });

  it("answers 500 without details when the store fails", async () => {
    const broken = {
      ...emptyStore,
      listActiveSettings: async () => Promise.reject(new Error("db down")),
    };
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await handler({ getStore: () => broken })(request("Bearer s3cret"));
    errors.mockRestore();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Dispatch failed." });
  });
});
