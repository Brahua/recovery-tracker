import { describe, expect, it } from "vitest";

import { getChosenDisplayName, getUserDisplayName } from "@/lib/user-display-name";

describe("getUserDisplayName", () => {
  it("prefers the name chosen in Ajustes, as typed", () => {
    expect(
      getUserDisplayName({
        email: "josuebh62@gmail.com",
        user_metadata: { display_name: " Josué Bravo ", full_name: "Josue Bravo Huaman" },
      }),
    ).toBe("Josué Bravo");
  });

  it("ignores a blank or cleared chosen name", () => {
    expect(
      getUserDisplayName({ user_metadata: { display_name: null, full_name: "Josué Bravo" } }),
    ).toBe("Josué");
    expect(
      getUserDisplayName({ user_metadata: { display_name: "  ", full_name: "Josué Bravo" } }),
    ).toBe("Josué");
  });

  it("uses the first word of full_name from user metadata", () => {
    expect(
      getUserDisplayName({
        email: "josuebh62@gmail.com",
        user_metadata: { full_name: "  Josué Bravo " },
      }),
    ).toBe("Josué");
  });

  it("falls back to the capitalized email local part", () => {
    expect(getUserDisplayName({ email: "maria.lopez@example.com" })).toBe("Maria");
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

describe("getChosenDisplayName", () => {
  it("returns only the name chosen in Ajustes", () => {
    expect(getChosenDisplayName({ user_metadata: { display_name: "Jos" } })).toBe("Jos");
    expect(getChosenDisplayName({ user_metadata: { full_name: "Josué Bravo" } })).toBeNull();
  });
});
