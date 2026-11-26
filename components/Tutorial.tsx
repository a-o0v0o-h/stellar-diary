"use client";

import { useEffect, useState } from "react";
import { RiAddLine, RiCloseLine } from "react-icons/ri";

type Props = {
  onClose: () => void;
};

/** 星空の見方を表す小さな図 */
function StarMapGuide() {
  return (
    <div className="relative mx-auto mt-2 mb-6 h-36 w-full max-w-64 rounded-lg border border-gray-800 bg-black">
      <span className="absolute left-2 top-2 text-[10px] text-gray-500">
        元気
      </span>
      <span className="absolute bottom-2 left-2 text-[10px] text-gray-500">
        ネガティブ
      </span>
      <span className="absolute bottom-2 right-2 text-[10px] text-gray-500">
        ポジティブ
      </span>
      <span className="absolute left-[22%] top-[55%] size-2 rounded-full bg-white opacity-40" />
      <span className="absolute left-[48%] top-[30%] size-3 rounded-full bg-white opacity-70 shadow-[0_0_6px_2px_rgba(255,255,255,0.6)]" />
      <span className="absolute left-[78%] top-[18%] size-5 rounded-full bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.6)]" />
    </div>
  );
}

const STEPS = [
  {
    title: "Stellar Diary へようこそ",
    body: (
      <p>
        ひとこと日記を書くと、AI が気持ちを読み取って、星空に星がひとつ生まれます。
      </p>
    ),
  },
  {
    title: "星空の見方",
    body: (
      <>
        <StarMapGuide />
        <ul className="space-y-1">
          <li>右にあるほど、ポジティブな気持ち</li>
          <li>上にあるほど、元気な 1 日</li>
          <li>大きいほど、気持ちが強い</li>
          <li>明るいほど、最近の日記</li>
        </ul>
      </>
    ),
  },
  {
    title: "星をタップしてみよう",
    body: (
      <p>
        星をタップすると、その日に書いた日記が読めます。いま光っている星はサンプルなので、気軽にのぞいてみてください。
      </p>
    ),
  },
  {
    title: "日記を書いてみよう",
    body: (
      <>
        <p>
          右下の
          <span className="mx-1 inline-flex size-6 items-center justify-center rounded-full bg-indigo-500 align-middle text-white">
            <RiAddLine size={16} />
          </span>
          から、今日のひとことを書いてみましょう。
        </p>
        <p className="mt-3 text-xs text-gray-500">
          書いた内容はこのブラウザの中だけに保存されます。
        </p>
      </>
    ),
  },
];

export default function Tutorial({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="mx-4 w-full max-w-md rounded-2xl border border-gray-800
        bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="tutorial-title" className="text-lg text-white">
            {current.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="cursor-pointer text-gray-400 hover:text-gray-300"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="min-h-24 text-sm leading-relaxed text-gray-300">
          {current.body}
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`size-1.5 rounded-full ${i === step ? "bg-white" : "bg-gray-600"}`}
            />
          ))}
        </div>
        <p className="sr-only">
          {step + 1} / {STEPS.length}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          {step === 0 ? (
            <button
              onClick={onClose}
              className="cursor-pointer text-sm text-gray-400 hover:text-gray-300"
            >
              スキップ
            </button>
          ) : (
            <button
              onClick={() => setStep(step - 1)}
              className="cursor-pointer text-sm text-gray-400 hover:text-gray-300"
            >
              戻る
            </button>
          )}
          <button
            onClick={isLast ? onClose : () => setStep(step + 1)}
            className="cursor-pointer rounded-full bg-indigo-500 px-6 py-2 font-medium text-white hover:bg-indigo-400"
          >
            {isLast ? "はじめる" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
