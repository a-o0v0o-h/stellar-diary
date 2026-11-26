/**
 * IP ごとに 1 日あたりの解析回数を制限する
 *
 * サーバーのメモリ上で数えるため、サーバーレス環境ではインスタンスごとのカウントになる。
 * 料金の上限は OpenAI 側のクレジット（自動チャージなし）で担保し、ここでは連打を防ぐ目的で使う。
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = Number(process.env.DAILY_ANALYZE_LIMIT ?? 10);

const counts = new Map<string, { count: number; resetAt: number }>();

export const consumeRateLimit = (key: string): boolean => {
  const now = Date.now();
  const entry = counts.get(key);

  if (!entry || entry.resetAt <= now) {
    counts.set(key, { count: 1, resetAt: now + DAY_MS });
    return true;
  }

  if (entry.count >= DAILY_LIMIT) return false;

  entry.count += 1;
  return true;
};
