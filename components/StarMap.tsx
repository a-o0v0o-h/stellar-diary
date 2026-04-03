"use client";

import { Diary } from "@/generated/prisma/client";
import { useEffect, useMemo, useState } from "react";
import DiaryDetails from "./DiaryDetails";

type Star = {
  id: string;
  emotion: number;
  energy: number;
  intensity: number;
};

type Props = {
  diaries: Diary[];
};

export default function StarMap({ diaries }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      const now = Date.now();
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
  }, [diaries]);

  if (!isMounted) return null;

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

      {/* うっすらノイズ（雰囲気） */}
      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:20px_20px]" />
    </div>
  );
}
