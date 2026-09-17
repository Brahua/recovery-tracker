// Client-only ids for unsaved drafts (entries and sets); never persisted.
export function createDraftId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
