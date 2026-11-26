"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import InputModal from "@/components/InputModal";
import StarMap from "@/components/StarMap";
import {
  addDiary,
  type Diary,
  getServerSnapshot,
  getSnapshot,
  seedSamplesIfFirstVisit,
  subscribe,
} from "@/lib/diaryStore";

export default function DiaryApp() {
  const diaries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => dayjs().unix());

  useEffect(() => {
    seedSamplesIfFirstVisit();
  }, []);

  // 直近 30 日分だけを星として表示する
  const recentDiaries = useMemo(() => {
    const thirtyDaysAgo = dayjs.unix(now).subtract(30, "day");
    return diaries.filter((diary) => dayjs(diary.createdAt).isAfter(thirtyDaysAgo));
  }, [diaries, now]);

  const handleCreated = (diary: Diary) => {
    addDiary(diary);
    setNow(dayjs().unix());
  };

  return (
    <>
      <StarMap diaries={recentDiaries} now={now} />
      <InputModal onCreated={handleCreated} />
    </>
  );
}
