import { describe, expect, it } from "vitest";

import { buildInviteMessage, isAppAdmin, mapAccessOverview } from "@/lib/access";

describe("access", () => {
  it("maps admin_list_access() into the overview the settings section renders", () => {
    expect(
      mapAccessOverview({
        mode: "open",
        invites: [
          { email: "a@gmail.com", note: "fisio", created_at: "2026-10-01T10:00:00Z", joined: true },
          { email: "b@gmail.com", note: null, created_at: "2026-10-01T09:00:00Z", joined: false },
        ],
      }),
    ).toEqual({
      mode: "open",
      invites: [
        { email: "a@gmail.com", note: "fisio", createdAt: "2026-10-01T10:00:00Z", joined: true },
        { email: "b@gmail.com", note: null, createdAt: "2026-10-01T09:00:00Z", joined: false },
      ],
    });
  });

  it("falls back to invite-only and skips malformed rows", () => {
    expect(mapAccessOverview(null)).toEqual({ mode: "invite_only", invites: [] });
    expect(mapAccessOverview({ mode: "weird", invites: [{ note: "x" }] })).toEqual({
      mode: "invite_only",
      invites: [],
    });
  });

  it("recognizes the admin only from app_metadata.role", () => {
    expect(isAppAdmin({ app_metadata: { role: "admin" } })).toBe(true);
    expect(isAppAdmin({ app_metadata: { provider: "google" } })).toBe(false);
    expect(isAppAdmin(null)).toBe(false);
  });

  it("builds the invitation with the email to use and the app link", () => {
    const message = buildInviteMessage("b@gmail.com", "https://recovery-tracker.brahua.com");
    expect(message).toContain("cuenta de Google (b@gmail.com)");
    expect(message).toContain("https://recovery-tracker.brahua.com");
  });
});
