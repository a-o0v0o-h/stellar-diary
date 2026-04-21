"use client";

import { Diary } from "@/generated/prisma/client";
import { useEffect, useState } from "react";
import DiaryDetails from "./DiaryDetails";

type Props = {
  diaries: Diary[];
  now: number;
};

type MappedStar = {
  id: string;
  content: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
};

export default function StarMap({ diaries, now }: Props) {
  const [mappedStars, setMappedStars] = useState<MappedStar[]>([]);

  useEffect(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    setMappedStars(
      diaries.map((diary) => {
        const x = (diary.emotion / 100) * windowWidth;
        const y = windowHeight - (diary.energy / 100) * windowHeight;

        const size = 2 + diary.intensity / 10;

        const created = new Date(diary.createdAt).getTime();
        const age = now - created;

        const maxAge = 1000 * 60 * 60 * 24 * 30;
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
      })
    );
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
            className="bg-white rounded-full cursor-pointer shadow-[0_0_6px_2px_rgba(255,255,255,0.6),0_0_12px_4px_rgba(200,220,255,0.3)]"
            popoverTarget={`details-${star.id}`}
            style={{
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
          <DiaryDetails id={star.id} content={star.content} />
        </div>
      ))}
    </div>
  );
}
