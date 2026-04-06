"use client";

import { Diary } from "@/generated/prisma/client";
import { useMemo } from "react";
import DiaryDetails from "./DiaryDetails";

type Props = {
  diaries: Diary[];
  now: number;
};

export default function StarMap({ diaries, now }: Props) {
  const mappedStars = useMemo(() => {
    if (typeof window === "undefined") return [];

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    return diaries.map((diary) => {
      const x = (diary.emotion / 100) * windowWidth;
      const y = windowHeight - (diary.energy / 100) * windowHeight;

      // サイズ（感情強度）
      const size = 2 + diary.intensity / 10;

      // 明るさ（新しさ）
      const created = new Date(diary.createdAt).getTime();
      const age = now - created; // 古さ

      const maxAge = 1000 * 60 * 60 * 24 * 30; // 30日
      const normalized = 1 - Math.min(age / maxAge, 1);
      const opacity = 0.3 + normalized * 0.7;

      return {
        id: diary.id,
        content: diary.content,
        x,
        y,
        size,
        opacity,
      };
    });
  }, [diaries, now]);

  return (
    <div className="relative w-full h-full">
      {/* 星 */}
      {mappedStars.map((star) => (
        <div
          key={star.id}
          className="absolute size-fit"
          style={{ left: star.x, top: star.y }}
        >
          <button
            key={star.id}
            className={`bg-white rounded-full cursor-pointer`}
            popoverTarget={`details-${star.id}`}
            style={{
              width: star.size,
              height: star.size,
            }}
          />
          <DiaryDetails id={star.id} content={star.content} />
        </div>
      ))}
    </div>
  );
}
