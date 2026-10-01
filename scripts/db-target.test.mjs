import { describe, expect, it } from "vitest";

import {
  PRODUCTION_PROJECT_REF,
  e2eTargetRefusal,
  isLocalSupabaseUrl,
  remoteWriteRefusal,
} from "./db-target.mjs";

describe("isLocalSupabaseUrl", () => {
  it("accepts the local CLI stack", () => {
    expect(isLocalSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://host.docker.internal:54321")).toBe(true);
  });

  it("rejects hosted projects, look-alikes and garbage", () => {
    expect(isLocalSupabaseUrl(`https://${PRODUCTION_PROJECT_REF}.supabase.co`)).toBe(false);
    expect(isLocalSupabaseUrl("https://localhost.evil.example")).toBe(false);
    expect(isLocalSupabaseUrl("not a url")).toBe(false);
    expect(isLocalSupabaseUrl(undefined)).toBe(false);
  });
});

describe("remoteWriteRefusal", () => {
  it("refuses production without ALLOW_PROD_DB", () => {
    expect(remoteWriteRefusal(PRODUCTION_PROJECT_REF, {})).toMatch(/PRODUCTION/);
    expect(remoteWriteRefusal(PRODUCTION_PROJECT_REF, { ALLOW_PROD_DB: "true" })).toMatch(
      /PRODUCTION/,
    );
  });

  it("refuses any other hosted project too", () => {
    expect(remoteWriteRefusal("otherref", {})).toMatch(/hosted project/);
  });

  it("refuses when nothing is linked", () => {
    expect(remoteWriteRefusal(null, { ALLOW_PROD_DB: "1" })).toMatch(
      /No Supabase project is linked/,
    );
  });

  it("allows the write with ALLOW_PROD_DB=1", () => {
    expect(remoteWriteRefusal(PRODUCTION_PROJECT_REF, { ALLOW_PROD_DB: "1" })).toBeNull();
  });
});

describe("e2eTargetRefusal", () => {
  it("allows local Supabase", () => {
    expect(e2eTargetRefusal("http://127.0.0.1:54321")).toBeNull();
  });

  it("refuses production and unset URLs", () => {
    expect(e2eTargetRefusal(`https://${PRODUCTION_PROJECT_REF}.supabase.co`)).toMatch(
      /local Supabase/,
    );
    expect(e2eTargetRefusal(undefined)).toMatch(/unset/);
  });
});
