"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RiCalendarLine, RiQuestionLine } from "react-icons/ri";
import CalendarModal from "@/components/CalendarModal";
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
  const [isHelpGlowing, setIsHelpGlowing] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    // 初めてのチュートリアルを閉じたときは、見直せる場所を光らせて教える
    if (!hasSeenTutorial) setIsHelpGlowing(true);
    tutorialStore.markTutorialSeen();
    setIsTutorialReopened(false);
  };

  const startWriting = () => {
    tutorialStore.markTutorialSeen();
    setIsTutorialReopened(false);
    setIsInputOpen(true);
  };

  return (
    <>
      <StarMap diaries={recentDiaries} now={now} />
      <InputModal
        isOpen={isInputOpen}
        onOpenChange={setIsInputOpen}
        onCreated={handleCreated}
      />

      <button
        onClick={() => setIsCalendarOpen(true)}
        aria-label="カレンダーを開く"
        data-tour="calendar-button"
        className="fixed right-14 top-4 cursor-pointer text-gray-500 hover:text-gray-300"
      >
        <RiCalendarLine size={22} />
      </button>
      {isCalendarOpen && (
        <CalendarModal diaries={diaries} onClose={() => setIsCalendarOpen(false)} />
      )}

      <button
        onClick={() => setIsTutorialReopened(true)}
        onAnimationEnd={() => setIsHelpGlowing(false)}
        data-tour="help-button"
        aria-label="使い方を見る"
        className={`fixed right-4 top-4 cursor-pointer rounded-full text-gray-500 hover:text-gray-300 ${isHelpGlowing ? "help-glow" : ""}`}
      >
        <RiQuestionLine size={22} />
      </button>
      {(!hasSeenTutorial || isTutorialReopened) && (
        <Tutorial onClose={closeTutorial} onStartWriting={startWriting} />
      )}
    </>
  );
}
