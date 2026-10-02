import { describe, expect, it } from "vitest";

import { accessModeSchema, inviteEmailSchema } from "@/lib/validation/access";

describe("access validation", () => {
  it("normalizes an invited email to how the allowlist stores it", () => {
    expect(inviteEmailSchema.parse("  Friend.Name@Gmail.COM ")).toBe("friend.name@gmail.com");
  });

  it("rejects values that are not emails, with a Spanish message", () => {
    const result = inviteEmailSchema.safeParse("friend");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("correo válido");
    expect(inviteEmailSchema.safeParse("").success).toBe(false);
    expect(inviteEmailSchema.safeParse(42).success).toBe(false);
  });

  it("accepts only the two access modes", () => {
    expect(accessModeSchema.parse("open")).toBe("open");
    expect(accessModeSchema.parse("invite_only")).toBe("invite_only");
    expect(accessModeSchema.safeParse("everyone").success).toBe(false);
  });
});
