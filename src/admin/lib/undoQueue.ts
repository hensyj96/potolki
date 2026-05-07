/**
 * Lightweight singleton undo queue. Components can subscribe to register
 * actions and consume them via toast "Отменить".
 */

export type UndoEntry = {
  id: string;
  label: string;
  description?: string;
  /** Function to undo the action. Should be idempotent if possible. */
  undo: () => Promise<void> | void;
  /** Time-to-live in ms after which the entry is auto-discarded */
  ttl: number;
  expiresAt: number;
};

type Listener = (entries: ReadonlyArray<UndoEntry>) => void;

const entries = new Map<string, UndoEntry>();
const timers = new Map<string, number>();
const listeners = new Set<Listener>();

function emit() {
  const list = Array.from(entries.values());
  listeners.forEach((l) => l(list));
}

export function pushUndo(entry: Omit<UndoEntry, 'expiresAt'>): string {
  const expiresAt = Date.now() + entry.ttl;
  const full: UndoEntry = { ...entry, expiresAt };
  entries.set(entry.id, full);

  const t = window.setTimeout(() => {
    entries.delete(entry.id);
    timers.delete(entry.id);
    emit();
  }, entry.ttl);
  const prev = timers.get(entry.id);
  if (prev) window.clearTimeout(prev);
  timers.set(entry.id, t);

  emit();
  return entry.id;
}

export async function consumeUndo(id: string): Promise<boolean> {
  const entry = entries.get(id);
  if (!entry) return false;
  entries.delete(id);
  const t = timers.get(id);
  if (t) window.clearTimeout(t);
  timers.delete(id);
  emit();
  try {
    await entry.undo();
    return true;
  } catch (err) {
    console.error('Undo failed:', err);
    return false;
  }
}

export function clearUndoEntry(id: string) {
  entries.delete(id);
  const t = timers.get(id);
  if (t) window.clearTimeout(t);
  timers.delete(id);
  emit();
}

export function subscribeUndo(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
