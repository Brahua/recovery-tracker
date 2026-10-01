import { describe, expect, it } from "vitest";

import { getInstallState } from "@/lib/pwa/install-state";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const android = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36";

describe("getInstallState", () => {
  it("is installed when running standalone, on any device", () => {
    expect(getInstallState({ userAgent: iphone, maxTouchPoints: 5, standalone: true })).toBe("installed");
  });

  it("detects iPhone and iPadOS (which reports itself as a Mac with touch)", () => {
    expect(getInstallState({ userAgent: iphone, maxTouchPoints: 5, standalone: false })).toBe("ios");
    expect(getInstallState({ userAgent: ipad, maxTouchPoints: 5, standalone: false })).toBe("ios");
  });

  it("treats a Mac without touch and Android as other", () => {
    expect(getInstallState({ userAgent: ipad, maxTouchPoints: 0, standalone: false })).toBe("other");
    expect(getInstallState({ userAgent: android, maxTouchPoints: 5, standalone: false })).toBe("other");
  });
});
