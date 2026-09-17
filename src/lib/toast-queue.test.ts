import { describe, expect, it } from "vitest";

import { addToast, removeToast, type Toast } from "@/lib/toast-queue";

const toast = (id: number, message = `toast ${id}`): Toast => ({
  id,
  message,
  tone: "success",
});

describe("toast queue", () => {
  it("appends toasts and keeps the three most recent", () => {
    const queue = [toast(1), toast(2), toast(3)].reduce(addToast, [] as Toast[]);
    expect(addToast(queue, toast(4)).map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it("replaces a toast with the same message", () => {
    const queue = addToast([toast(1, "Rutina guardada"), toast(2)], toast(3, "Rutina guardada"));
    expect(queue.map((item) => item.id)).toEqual([2, 3]);
  });

  it("removes a toast by id", () => {
    expect(removeToast([toast(1), toast(2)], 1).map((item) => item.id)).toEqual([2]);
  });
});
