/** The sound switch is remembered on this device only; storage may be blocked, so every access is guarded. */
const KEY = "pip.muted";
const listeners = new Set<() => void>();
let current: boolean | null = null;

export function readMuted(): boolean {
  if (current !== null) return current;
  try {
    current = window.localStorage.getItem(KEY) === "1";
  } catch {
    current = false;
  }
  return current;
}

export function writeMuted(muted: boolean): void {
  current = muted;
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // Without storage the choice still holds until the page closes.
  }
  listeners.forEach((notify) => notify());
}

export function subscribeMuted(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
