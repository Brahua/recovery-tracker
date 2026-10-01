import { describe, expect, it, vi } from "vitest";

import { createPushSender, readVapidConfig, type WebPushClient } from "@/lib/push/sender";
import { reminderMessages } from "@/lib/reminders/messages";

const vapid = { subject: "mailto:owner@example.com", publicKey: "pub", privateKey: "priv" };
const subscription = { endpoint: "https://web.push.apple.com/abc", keys: { p256dh: "p", auth: "a" } };

function clientThat(result: () => Promise<unknown>): WebPushClient {
  return { sendNotification: vi.fn(result) };
}

describe("readVapidConfig", () => {
  it("needs the public key, private key and subject", () => {
    expect(readVapidConfig({})).toBeNull();
    expect(readVapidConfig({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" })).toBeNull();
    expect(
      readVapidConfig({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: " pub ", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "mailto:owner@example.com" }),
    ).toEqual(vapid);
  });
});

describe("createPushSender", () => {
  it("sends the payload as JSON with VAPID details and a two-hour TTL", async () => {
    const client = clientThat(async () => ({ statusCode: 201 }));
    const result = await createPushSender(client, vapid)(subscription, reminderMessages.closeout);
    expect(result).toEqual({ status: "sent" });
    expect(client.sendNotification).toHaveBeenCalledWith(subscription, JSON.stringify(reminderMessages.closeout), {
      vapidDetails: vapid,
      TTL: 7200,
      urgency: "normal",
    });
  });

  it("reports 404 and 410 as gone so the subscription is deleted", async () => {
    for (const statusCode of [404, 410]) {
      const client = clientThat(async () => Promise.reject(Object.assign(new Error("gone"), { statusCode })));
      expect(await createPushSender(client, vapid)(subscription, reminderMessages.session)).toEqual({ status: "gone" });
    }
  });

  it("reports other errors as failures without throwing", async () => {
    const client = clientThat(async () => Promise.reject(Object.assign(new Error("boom"), { statusCode: 500, body: "server" })));
    expect(await createPushSender(client, vapid)(subscription, reminderMessages.session)).toEqual({
      status: "failed",
      statusCode: 500,
      message: "server",
    });
  });
});

describe("reminder messages", () => {
  it("open the matching Registrar mode", () => {
    expect(reminderMessages.session.url).toBe("/registrar?mode=session");
    expect(reminderMessages.closeout.url).toBe("/registrar?mode=closeout");
  });
});
