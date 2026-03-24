/**
 * 数値を 0-100 の範囲に収める
 */
export const normalize = (n: number) => Math.max(0, Math.min(100, n));
