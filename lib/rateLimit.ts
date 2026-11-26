/**
 * IP ごとに 1 日あたりの回数を制限する
 *
 * サーバーのメモリ上で数えるため、サーバーレス環境ではインスタンスごとのカウントになる。
 * 料金の上限は OpenAI 側のクレジット（自動チャージなし）で担保し、ここでは連打を防ぐ目的で使う。
 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** 1 日 limit 回まで許可する制限をつくる。機能ごとに別々に数える */
export const createRateLimit = (limit: number) => {
  const counts = new Map<string, { count: number; resetAt: number }>();

  return (key: string): boolean => {
    const now = Date.now();
    const entry = counts.get(key);

    if (!entry || entry.resetAt <= now) {
      counts.set(key, { count: 1, resetAt: now + DAY_MS });
      return true;
    }

    if (entry.count >= limit) return false;

    entry.count += 1;
    return true;
  };
};

/** 日記の解析（星をつくる）の回数制限 */
export const consumeRateLimit = createRateLimit(Number(process.env.DAILY_ANALYZE_LIMIT ?? 3));
