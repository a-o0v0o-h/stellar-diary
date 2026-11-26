import dayjs, { type Dayjs } from "dayjs";

/** 月曜はじまりの週の初日（0 時） */
export const startOfWeek = (date: Dayjs) =>
  date.startOf("day").subtract((date.day() + 6) % 7, "day");

/** 日を表すキー */
export const dayKey = (date: Dayjs | string) => dayjs(date).format("YYYY-MM-DD");

/** 月を表すキー */
export const monthKey = (date: Dayjs) => date.format("YYYY-MM");
