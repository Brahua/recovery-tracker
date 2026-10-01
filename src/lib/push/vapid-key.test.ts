import { describe, expect, it } from "vitest";

import { urlBase64ToUint8Array } from "@/lib/push/vapid-key";

describe("urlBase64ToUint8Array", () => {
  it("decodes base64url without padding", () => {
    expect([...urlBase64ToUint8Array("AQID_w")]).toEqual([1, 2, 3, 255]);
    expect([...urlBase64ToUint8Array("-_8")]).toEqual([251, 255]);
  });
});
