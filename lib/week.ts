import dayjs, { type Dayjs } from "dayjs";

/** 月曜はじまりの週の初日（0 時） */
export const startOfWeek = (date: Dayjs) =>
  date.startOf("day").subtract((date.day() + 6) % 7, "day");

/** 週を表すキー（その週の月曜日の日付） */
export const weekKey = (date: Dayjs) => startOfWeek(date).format("YYYY-MM-DD");

/** 日を表すキー */
export const dayKey = (date: Dayjs | string) => dayjs(date).format("YYYY-MM-DD");
