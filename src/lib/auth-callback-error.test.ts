import { describe, expect, it } from "vitest";

import {
  getAuthCallbackErrorCopy,
  normalizeAuthCallbackReason,
} from "@/lib/auth-callback-error";
import { selectRequestOrigin } from "@/lib/supabase/urls";

describe("auth callback errors", () => {
  it("keeps supported reasons and rejects arbitrary query values", () => {
    expect(normalizeAuthCallbackReason("provider_rejected")).toBe(
      "provider_rejected",
    );
    expect(normalizeAuthCallbackReason("anything-else")).toBe("unknown");
    expect(normalizeAuthCallbackReason(undefined)).toBe("unknown");
  });

  it("provides actionable copy for a failed PKCE exchange", () => {
    expect(getAuthCallbackErrorCopy("exchange_failed")).toEqual({
      title: "No pudimos verificar el acceso.",
      description:
        "Inicia el acceso nuevamente desde la misma direccion y el mismo navegador. No cambies entre localhost, 127.0.0.1 o la IP de tu red.",
    });
  });

  it("provides provider-specific copy when Google rejects the request", () => {
    expect(getAuthCallbackErrorCopy("provider_rejected").description).toContain(
      "Google",
    );
  });

  it("keeps the active loopback origin so the PKCE cookie stays available", () => {
    expect(
      selectRequestOrigin("http://localhost:3000", "http://127.0.0.1:3000"),
    ).toBe("http://127.0.0.1:3000");
    expect(
      selectRequestOrigin("http://localhost:3000", "http://localhost:3001"),
    ).toBe("http://localhost:3001");
  });

  it("does not let request headers replace a configured hosted origin", () => {
    expect(
      selectRequestOrigin(
        "https://staging.example.com",
        "https://attacker.example.com",
      ),
    ).toBe("https://staging.example.com");
  });
});
