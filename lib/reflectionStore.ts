import type { ReflectedQuote } from "@/app/api/reflect/route";

export type Reflection = {
  comment: string;
  quote: ReflectedQuote;
  /** ふりかえりに使った日記。書き足したら作り直せるように覚えておく */
  diaryIds: string[];
  /** ISO 8601 形式の日時 */
  createdAt: string;
};

/** 週のキー（その週の月曜日の日付）ごとのふりかえり */
export type Reflections = Record<string, Reflection>;

const STORAGE_KEY = "stellar-diary:reflections";
const EMPTY: Reflections = {};

const listeners = new Set<() => void>();

/** localStorage が使えない環境では、開いているあいだだけ覚えておく */
let memoryFallback: Reflections | null = null;
let cache: { raw: string | null; reflections: Reflections } = {
  raw: null,
  reflections: EMPTY,
};

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): Reflections => {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Reflections)
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

export const getSnapshot = (): Reflections => {
  if (memoryFallback) return memoryFallback;

  const raw = readRaw();
  if (raw !== cache.raw) {
    cache = { raw, reflections: parse(raw) };
  }
  return cache.reflections;
};

export const getServerSnapshot = (): Reflections => EMPTY;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const saveReflection = (week: string, reflection: Reflection) => {
  const reflections = { ...getSnapshot(), [week]: reflection };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
    memoryFallback = null;
  } catch {
    memoryFallback = reflections;
  }
  listeners.forEach((listener) => listener());
};
