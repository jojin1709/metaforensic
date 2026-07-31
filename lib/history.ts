export interface HistoryEntry {
  id: string;
  filename: string;
  dhash: string;
  analyzedAt: string;
}

const KEY = "metaforensic_history_v1";

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  const current = getHistory();
  const updated = [entry, ...current].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(updated));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
