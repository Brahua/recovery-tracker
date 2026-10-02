import { describe, expect, it } from "vitest";

import { hasCompletedOnboarding, ONBOARDING_REPLAY_PATH } from "@/lib/onboarding";
import { completeOnboardingSchema } from "@/lib/validation/onboarding";

describe("onboarding", () => {
  it("is pending until onboarding_completed_at is saved", () => {
    expect(hasCompletedOnboarding(null)).toBe(false);
    expect(hasCompletedOnboarding({ full_name: "Ana Pérez" })).toBe(false);
    expect(hasCompletedOnboarding({ onboarding_completed_at: "" })).toBe(false);
    expect(hasCompletedOnboarding({ onboarding_completed_at: "2026-10-01T12:00:00.000Z" })).toBe(
      true,
    );
  });

  it("replays the tour from Ajustes", () => {
    expect(ONBOARDING_REPLAY_PATH).toBe("/bienvenida?recorrido=1");
  });

  it("accepts the setup with the medical notice and normalizes the name", () => {
    const parsed = completeOnboardingSchema.parse({
      kind: "setup",
      name: "  Ana   María ",
      appearance: { theme: "light", accent: "amber" },
      acceptedNotice: true,
    });
    expect(parsed).toEqual({
      kind: "setup",
      name: "Ana María",
      appearance: { theme: "light", accent: "amber" },
      acceptedNotice: true,
    });
  });

  it("keeps the Google name when the name is left empty", () => {
    const parsed = completeOnboardingSchema.parse({
      kind: "setup",
      name: "",
      appearance: { theme: "dark", accent: "green" },
      acceptedNotice: true,
    });
    expect(parsed.kind === "setup" && parsed.name).toBeNull();
  });

  it("requires the medical notice to finish the setup", () => {
    const result = completeOnboardingSchema.safeParse({
      kind: "setup",
      name: "Ana",
      appearance: { theme: "dark", accent: "green" },
      acceptedNotice: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("aviso");
  });

  it("lets the tour be skipped without any other data", () => {
    expect(completeOnboardingSchema.parse({ kind: "skip" })).toEqual({ kind: "skip" });
    expect(completeOnboardingSchema.safeParse({ kind: "other" }).success).toBe(false);
  });
});
