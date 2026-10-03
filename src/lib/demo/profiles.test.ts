import { describe, expect, it } from "vitest";

import { demoProfileIds, demoProfiles, getDemoProfileId, isDemoProfileId } from "./profiles";

describe("demo profiles", () => {
  it("has the three patients, each with its own email", () => {
    expect(demoProfileIds).toEqual(["knee", "ankle", "shoulder"]);
    const emails = demoProfileIds.map((id) => demoProfiles[id].email);
    expect(new Set(emails).size).toBe(3);
    for (const id of demoProfileIds) expect(demoProfiles[id].id).toBe(id);
  });

  it("only accepts the known ids", () => {
    expect(isDemoProfileId("knee")).toBe(true);
    expect(isDemoProfileId("admin")).toBe(false);
    expect(isDemoProfileId(null)).toBe(false);
  });

  it("reads the demo marker from app_metadata only", () => {
    expect(getDemoProfileId({ demo_profile: "ankle" })).toBe("ankle");
    expect(getDemoProfileId({ demo_profile: "nope" })).toBeNull();
    expect(getDemoProfileId({})).toBeNull();
    expect(getDemoProfileId(null)).toBeNull();
  });
});
