type Listener = () => void;

export interface PendingStore {
  begin: () => () => void;
  getSnapshot: () => number;
  subscribe: (listener: Listener) => () => void;
}

// Counts server round-trips in flight (navigations, form submissions, server
// actions) so a single global indicator can reflect all of them.
export function createPendingStore(): PendingStore {
  let count = 0;
  const listeners = new Set<Listener>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    begin() {
      count += 1;
      emit();

      let ended = false;
      return () => {
        if (ended) return;
        ended = true;
        count = Math.max(0, count - 1);
        emit();
      };
    },
    getSnapshot: () => count,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const pendingStore = createPendingStore();
