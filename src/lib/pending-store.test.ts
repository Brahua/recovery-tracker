import { describe, expect, it, vi } from "vitest";

import { createPendingStore } from "@/lib/pending-store";

describe("createPendingStore", () => {
  it("counts overlapping operations", () => {
    const store = createPendingStore();
    const endFirst = store.begin();
    const endSecond = store.begin();

    expect(store.getSnapshot()).toBe(2);
    endFirst();
    expect(store.getSnapshot()).toBe(1);
    endSecond();
    expect(store.getSnapshot()).toBe(0);
  });

  it("ignores repeated calls to the same end function", () => {
    const store = createPendingStore();
    const endFirst = store.begin();
    store.begin();

    endFirst();
    endFirst();
    expect(store.getSnapshot()).toBe(1);
  });

  it("notifies subscribers until they unsubscribe", () => {
    const store = createPendingStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const end = store.begin();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    end();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
