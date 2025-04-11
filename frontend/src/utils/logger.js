export function devLog(label, ...data) {
    if (import.meta.env.DEV) {
      console.log(`[DEV] ${label}:`, ...data);
    }
  }