"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RiQuestionLine } from "react-icons/ri";
import InputModal from "@/components/InputModal";
import StarMap from "@/components/StarMap";
import Tutorial from "@/components/Tutorial";
import {
  addDiary,
  type Diary,
  getServerSnapshot,
  getSnapshot,
  seedSamplesIfFirstVisit,
  subscribe,
} from "@/lib/diaryStore";
import * as tutorialStore from "@/lib/tutorialStore";

export default function DiaryApp() {
  const diaries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [now, setNow] = useState(() => dayjs().unix());
  const hasSeenTutorial = useSyncExternalStore(
    tutorialStore.subscribe,
    tutorialStore.hasSeenTutorial,
    tutorialStore.getServerSnapshot,
  );
  const [isTutorialReopened, setIsTutorialReopened] = useState(false);

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

  const closeTutorial = () => {
    tutorialStore.markTutorialSeen();
    setIsTutorialReopened(false);
  };

  return (
    <>
      <StarMap diaries={recentDiaries} now={now} />
      <InputModal onCreated={handleCreated} />

      <button
        onClick={() => setIsTutorialReopened(true)}
        aria-label="使い方を見る"
        className="fixed right-4 top-4 cursor-pointer text-gray-500 hover:text-gray-300"
      >
        <RiQuestionLine size={22} />
      </button>
      {(!hasSeenTutorial || isTutorialReopened) && <Tutorial onClose={closeTutorial} />}
    </>
  );
}
