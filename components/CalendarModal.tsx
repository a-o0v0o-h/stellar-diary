"use client";

import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine } from "react-icons/ri";
import { toast } from "sonner";
import type { ReflectResponse } from "@/app/api/reflect/route";
import { MAX_REFLECTION_DIARIES, MIN_REFLECTION_DIARIES } from "@/lib/constants";
import type { Diary } from "@/lib/diaryStore";
import * as reflectionStore from "@/lib/reflectionStore";
import { starSize } from "@/lib/star";
import { dayKey, monthKey, startOfWeek } from "@/lib/date";

type Props = {
  onClose: () => void;
  diaries: Diary[];
};

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const WEEKDAY_OF = ["日", "月", "火", "水", "木", "金", "土"];

const ERROR_MESSAGES = {
  invalid: "この月の日記を読み込めませんでした。",
  rate_limited: "今日のふりかえりはここまでです。また明日試してください。",
  unavailable: "いまはふりかえりを作れません。時間をおいて試してください。",
} as const;

/** 星空と同じ大きさの星。ネガティブは青、ポジティブは金色 */
const starStyle = ({ emotion, intensity }: Diary) => {
  const hue = 220 - (emotion / 100) * 175;
  const size = starSize(intensity);
  return {
    width: size,
    height: size,
    backgroundColor: `hsl(${hue} 90% 80%)`,
    boxShadow: `0 0 6px 2px hsl(${hue} 90% 72% / 0.6), 0 0 12px 4px hsl(${hue} 90% 72% / 0.3)`,
  };
};

const formatDay = (date: Dayjs) => `${date.month() + 1}月${date.date()}日(${WEEKDAY_OF[date.day()]})`;

/** その月を表示するのに必要な週（月曜はじまり）の日付 */
const monthGrid = (month: Dayjs) => {
  const first = startOfWeek(month.startOf("month"));
  const last = month.endOf("month");
  const days: Dayjs[] = [];
  for (let day = first; !day.isAfter(last); day = day.add(1, "day")) days.push(day);
  while (days.length % 7 !== 0) days.push(days[days.length - 1].add(1, "day"));
  return days;
};

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

function DayDiaries({ date, diaries }: { date: Dayjs; diaries: Diary[] }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-sm text-white">{formatDay(date)}</h3>
      {diaries.length === 0 ? (
        <p className="text-xs text-gray-500">この日の日記はありません。</p>
      ) : (
        <ul className="space-y-2">
          {diaries.map((diary) => (
            <li key={diary.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-sm text-gray-200">{diary.content}</p>
              <p className="mt-1 text-xs text-gray-500">
                {dayjs(diary.createdAt).format("HH:mm")}
                <span className="ml-3">ポジティブ度 {diary.emotion}</span>
                <span className="ml-2">エネルギー {diary.energy}</span>
                <span className="ml-2">強さ {diary.intensity}</span>
                {diary.isSample && <span className="ml-2 text-gray-600">サンプル</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MonthReflection({ month, diaries }: { month: Dayjs; diaries: Diary[] }) {
  const reflections = useSyncExternalStore(
    reflectionStore.subscribe,
    reflectionStore.getSnapshot,
    reflectionStore.getServerSnapshot,
  );
  const [isLoading, setIsLoading] = useState(false);

  const key = monthKey(month);
  const saved = reflections[key];
  // サンプルの日記はふりかえりに使わない
  const ownDiaries = diaries.filter((diary) => !diary.isSample);
  const ownIds = ownDiaries.map((diary) => diary.id);
  const canReflect = ownDiaries.length >= MIN_REFLECTION_DIARIES;
  const isOutdated = !!saved && !sameIds(saved.diaryIds, ownIds);

  const reflect = async () => {
    setIsLoading(true);
    try {
      const sent = ownDiaries.slice(-MAX_REFLECTION_DIARIES);
      const res = await axios.post<ReflectResponse>(
        "/api/reflect",
        {
          diaries: sent.map(({ content, emotion, energy, intensity, createdAt }) => ({
            content,
            emotion,
            energy,
            intensity,
            date: dayKey(createdAt),
          })),
        },
        { validateStatus: () => true },
      );

      if (!res.data?.isOk) {
        toast.error(ERROR_MESSAGES[res.data?.reason ?? "unavailable"]);
        return;
      }

      reflectionStore.saveReflection(key, {
        comment: res.data.comment,
        quote: res.data.quote,
        diaryIds: ownIds,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      toast.error("ふりかえりに失敗しました。もう一度試してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const button = (label: string) => (
    <>
      <button
        onClick={reflect}
        disabled={isLoading}
        className="mt-3 w-full cursor-pointer rounded-full bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {isLoading ? "星をたどっています..." : label}
      </button>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        ふりかえりのため、この月の日記は OpenAI API に送信されます。
      </p>
    </>
  );

  return (
    <section className="mt-6 border-t border-gray-800 pt-5">
      <h3 className="text-sm text-white">
        {month.month() + 1}月のふりかえり
      </h3>

      {saved ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-gray-200">{saved.comment}</p>
          <figure className="mt-4 border-l-2 border-indigo-300/50 pl-3">
            <blockquote className="whitespace-pre-line text-sm leading-relaxed text-indigo-100">
              {saved.quote.text}
            </blockquote>
            <figcaption className="mt-1 text-xs text-gray-500">
              — {saved.quote.author}『{saved.quote.work}』
              <a
                href={saved.quote.source}
                target="_blank"
                rel="noreferrer"
                className="ml-2 underline hover:text-gray-300"
              >
                青空文庫
              </a>
            </figcaption>
          </figure>
          {isOutdated && canReflect && button("書き足した日記でふりかえり直す")}
        </div>
      ) : canReflect ? (
        button("この月をふりかえる")
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          あと {MIN_REFLECTION_DIARIES - ownDiaries.length} 件書くと、この月をふりかえれます。
          {ownDiaries.length < diaries.length && "（サンプルの日記は含まれません）"}
        </p>
      )}
    </section>
  );
}

export default function CalendarModal({ onClose, diaries }: Props) {
  const today = dayjs();
  const [month, setMonth] = useState(() => today.startOf("month"));
  const [selected, setSelected] = useState(() => today.startOf("day"));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 日ごとの日記（書いた順）
  const byDay = useMemo(() => {
    const map = new Map<string, Diary[]>();
    const sorted = [...diaries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const diary of sorted) {
      const key = dayKey(diary.createdAt);
      map.set(key, [...(map.get(key) ?? []), diary]);
    }
    return map;
  }, [diaries]);

  const days = monthGrid(month);
  const monthDiaries = Array.from({ length: month.daysInMonth() }, (_, i) =>
    byDay.get(dayKey(month.add(i, "day"))) ?? [],
  ).flat();
  const isCurrentMonth = month.isSame(today, "month");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="カレンダー"
        className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center">
          <h2 className="text-lg text-white" aria-live="polite">
            {month.year()}年{month.month() + 1}月
          </h2>
          <button
            onClick={() => setMonth(month.subtract(1, "month"))}
            aria-label="前の月"
            className="ml-3 cursor-pointer rounded-full p-1 text-gray-400 hover:text-gray-200"
          >
            <RiArrowLeftSLine size={20} />
          </button>
          <button
            onClick={() => setMonth(month.add(1, "month"))}
            disabled={isCurrentMonth}
            aria-label="次の月"
            className="cursor-pointer rounded-full p-1 text-gray-400 hover:text-gray-200 disabled:cursor-default disabled:opacity-30"
          >
            <RiArrowRightSLine size={20} />
          </button>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="ml-auto cursor-pointer text-gray-400 hover:text-gray-300"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="pb-1 text-xs text-gray-500">
              {weekday}
            </span>
          ))}
          {days.map((day) => {
            const dayDiaries = byDay.get(dayKey(day)) ?? [];
            const isInMonth = day.isSame(month, "month");
            const isSelected = day.isSame(selected, "day");
            const isToday = day.isSame(today, "day");
            // いちばん気持ちが強かった日記の星を出す
            const brightest = dayDiaries.reduce<Diary | undefined>(
              (max, diary) => (!max || diary.intensity > max.intensity ? diary : max),
              undefined,
            );

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelected(day);
                  if (!isInMonth) setMonth(day.startOf("month"));
                }}
                aria-pressed={isSelected}
                aria-label={`${day.month() + 1}月${day.date()}日${dayDiaries.length ? `（日記 ${dayDiaries.length} 件）` : ""}`}
                className={`flex h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors
                  ${isSelected ? "bg-indigo-500/30 text-white" : "hover:bg-white/5"}
                  ${isInMonth ? "text-gray-200" : "text-gray-600"}
                  ${isToday && !isSelected ? "ring-1 ring-indigo-300/50" : ""}`}
              >
                <span>{day.date()}</span>
                <span className="flex size-3 items-center justify-center" aria-hidden="true">
                  {brightest && <span className="rounded-full" style={starStyle(brightest)} />}
                </span>
              </button>
            );
          })}
        </div>

        <DayDiaries date={selected} diaries={byDay.get(dayKey(selected)) ?? []} />
        <MonthReflection key={monthKey(month)} month={month} diaries={monthDiaries} />
      </div>
    </div>
  );
}
