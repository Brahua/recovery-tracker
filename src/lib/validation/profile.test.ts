import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH, displayNameSchema } from "@/lib/validation/profile";

const parse = (value: unknown) => displayNameSchema.safeParse(value);

describe("displayNameSchema", () => {
  it("trims and collapses spaces", () => {
    expect(parse("  Josué   Bravo ").data).toBe("Josué Bravo");
  });

  it("turns an empty value into null to clear the name", () => {
    expect(parse("   ").data).toBeNull();
    expect(parse("").data).toBeNull();
  });

  it("accepts the maximum length and rejects longer names", () => {
    expect(parse("a".repeat(DISPLAY_NAME_MAX_LENGTH)).success).toBe(true);
    expect(parse("a".repeat(DISPLAY_NAME_MAX_LENGTH + 1)).success).toBe(false);
  });

  it("rejects control characters and non-strings", () => {
    expect(parse("Jo\u0007sué").success).toBe(false);
    expect(parse(42).success).toBe(false);
  });

  it("keeps line breaks out by collapsing them to a space", () => {
    expect(parse("Josué\nBravo").data).toBe("Josué Bravo");
  });
});
