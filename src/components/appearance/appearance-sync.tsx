"use client";

import { useEffect } from "react";

import { applyAppearance } from "@/components/appearance/apply-appearance";
import type { Accent, Theme } from "@/lib/appearance";

// The account is the source of truth: after signing in, or after a change on another device,
// this brings the cookie and <html> attributes in line with user_metadata.preferences.
export function AppearanceSync({ accent, theme }: { accent: Accent; theme: Theme }) {
  useEffect(() => {
    applyAppearance({ accent, theme });
  }, [accent, theme]);

  return null;
}
