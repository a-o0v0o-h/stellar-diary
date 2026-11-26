const STORAGE_KEY = "stellar-diary:tutorial-seen";

const listeners = new Set<() => void>();

/** localStorage が使えない環境では、開いているあいだだけ覚えておく */
let seenInMemory = false;

export const hasSeenTutorial = (): boolean => {
  if (seenInMemory) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

/** サーバーでは表示しない（初回だけクライアントで表示する） */
export const getServerSnapshot = (): boolean => true;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const markTutorialSeen = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    seenInMemory = true;
  }
  listeners.forEach((listener) => listener());
};
