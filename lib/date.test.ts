import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { startOfWeek } from "@/lib/date";

describe("startOfWeek", () => {
  it.each([
    ["月曜", "2026-11-23"],
    ["水曜", "2026-11-25"],
    ["日曜", "2026-11-29"],
  ])("%s はその週の月曜を返す", (_, date) => {
    expect(startOfWeek(dayjs(`${date}T21:30:00`)).format("YYYY-MM-DD")).toBe("2026-11-23");
  });

  it("0 時にそろえる", () => {
    expect(startOfWeek(dayjs("2026-11-25T21:30:00")).format("HH:mm")).toBe("00:00");
  });
});
