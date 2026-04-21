"use client";

import { Diary } from "@/generated/prisma/client";
import { useEffect, useRef, useState } from "react";
import DiaryDetails from "./DiaryDetails";

type Props = {
  diaries: Diary[];
  now: number;
};

type MappedStar = {
  id: string;
  content: string;
  emotion: number;
  energy: number;
  intensity: number;
  createdAt: Date;
  x: number;
  y: number;
  size: number;
  opacity: number;
};

export default function StarMap({ diaries, now }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mappedStars, setMappedStars] = useState<MappedStar[]>([]);

  useEffect(() => {
    // 星をコンテナ内に収めるように座標を計算
    const width = containerRef.current?.clientWidth ?? window.innerWidth;
    const height = containerRef.current?.clientHeight ?? window.innerHeight;

    setMappedStars(
      diaries.map((diary) => {
        const x = (diary.emotion / 100) * width;
        const y = height - (diary.energy / 100) * height;

        const size = 2 + diary.intensity / 10;

        const created = new Date(diary.createdAt).getTime();
        const age = now - created;

        const maxAge = 1000 * 60 * 60 * 24 * 30;
        const normalized = 1 - Math.min(age / maxAge, 1);
        const opacity = 0.3 + normalized * 0.7;

        return {
          id: diary.id,
          content: diary.content,
          emotion: diary.emotion,
          energy: diary.energy,
          intensity: diary.intensity,
          createdAt: diary.createdAt,
          x,
          y,
          size,
          opacity,
        };
      }),
    );
  }, [diaries, now]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
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
          <DiaryDetails
            id={star.id}
            content={star.content}
            emotion={star.emotion}
            energy={star.energy}
            intensity={star.intensity}
            createdAt={star.createdAt}
          />
        </div>
      ))}
    </div>
  );
}
