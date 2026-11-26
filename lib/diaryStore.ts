import dayjs from "dayjs";

export type Diary = {
  id: string;
  content: string;
  emotion: number;
  energy: number;
  intensity: number;
  /** ISO 8601 形式の日時 */
  createdAt: string;
  /** 初回表示用のサンプルかどうか */
  isSample?: boolean;
};

const STORAGE_KEY = "stellar-diary:diaries";
const EMPTY: Diary[] = [];

const listeners = new Set<() => void>();

/** localStorage が使えない環境（プライベートモードなど）ではメモリ上に保持する */
let memoryFallback: Diary[] | null = null;
let cache: { raw: string | null; diaries: Diary[] } = {
  raw: null,
  diaries: EMPTY,
};

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): Diary[] => {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Diary[]) : EMPTY;
  } catch {
    return EMPTY;
  }
};

const write = (diaries: Diary[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
    memoryFallback = null;
  } catch {
    memoryFallback = diaries;
  }
  listeners.forEach((listener) => listener());
};

export const getSnapshot = (): Diary[] => {
  if (memoryFallback) return memoryFallback;

  const raw = readRaw();
  if (raw !== cache.raw) {
    cache = { raw, diaries: parse(raw) };
  }
  return cache.diaries;
};

export const getServerSnapshot = (): Diary[] => EMPTY;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);

  // 別タブでの変更も反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/**
 * 日記を保存する。自分の日記を書いたら、お試し用のサンプルは片付ける
 * @returns サンプルを片付けたかどうか
 */
export const addDiary = (diary: Diary): boolean => {
  const current = getSnapshot();
  const own = current.filter((d) => !d.isSample);
  write([...own, diary]);
  return own.length < current.length;
};

/**
 * 初めて開いた人にも星空が見えるように、サンプルの星を一度だけ入れる
 */
export const seedSamplesIfFirstVisit = () => {
  if (memoryFallback || readRaw() !== null) return;

  const samples: Omit<Diary, "id" | "createdAt">[] = [
    { content: "久しぶりに友達とごはん。笑いすぎてお腹痛い", emotion: 88, energy: 80, intensity: 70 },
    { content: "雨で予定が流れた。家でゆっくりできたからまあいいか", emotion: 55, energy: 25, intensity: 30 },
    { content: "仕事でミスして落ち込んだ", emotion: 18, energy: 30, intensity: 75 },
    { content: "朝から散歩して、いい天気だった", emotion: 75, energy: 60, intensity: 40 },
    { content: "締め切り前でずっとバタバタしてる", emotion: 35, energy: 85, intensity: 60 },
    { content: "新しいカフェを見つけた。また行きたい", emotion: 80, energy: 55, intensity: 50 },
    { content: "なんとなくぼーっとした1日", emotion: 48, energy: 15, intensity: 15 },
  ];

  const daysAgo = [1, 3, 6, 9, 13, 18, 24];
  write(
    samples.map((sample, i) => ({
      ...sample,
      id: `sample-${i}`,
      createdAt: dayjs().subtract(daysAgo[i], "day").toISOString(),
      isSample: true,
    })),
  );
};
