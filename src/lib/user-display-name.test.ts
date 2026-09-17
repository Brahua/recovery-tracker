import { describe, expect, it } from "vitest";

import { getUserDisplayName } from "@/lib/user-display-name";

describe("getUserDisplayName", () => {
  it("uses the first word of full_name from user metadata", () => {
    expect(
      getUserDisplayName({
        email: "josuebh62@gmail.com",
        user_metadata: { full_name: "  Josué Bravo " },
      }),
    ).toBe("Josué");
  });

  it("falls back to the capitalized email local part", () => {
    expect(getUserDisplayName({ email: "maria.lopez@example.com" })).toBe(
      "Maria",
    );
  });

  it("ignores a blank or non-string full_name", () => {
    expect(
      getUserDisplayName({
        email: "ana@example.com",
        user_metadata: { full_name: "   " },
      }),
    ).toBe("Ana");
    expect(
      getUserDisplayName({
        email: "ana@example.com",
        user_metadata: { full_name: 42 },
      }),
    ).toBe("Ana");
  });

  it("returns null when there is no name or email", () => {
    expect(getUserDisplayName({})).toBeNull();
    expect(getUserDisplayName(null)).toBeNull();
  });
});
