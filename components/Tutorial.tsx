"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { RiCloseLine } from "react-icons/ri";

type Props = {
  onClose: () => void;
  onStartWriting: () => void;
};

type Step = {
  title: string;
  body: ReactNode;
  /** スポットライトを当てる要素の data-tour の値 */
  target?: string;
  /** 画面全体に星空の軸を重ねて表示する */
  showAxes?: boolean;
};

const STEPS: Step[] = [
  {
    title: "Stellar Diary へようこそ",
    body: "ひとこと日記を書くと、AI が気持ちを読み取って、星空に星がひとつ生まれます。",
  },
  {
    title: "画面全体が気持ちの地図",
    body: "右にあるほどポジティブ、上にあるほど元気な 1 日。大きい星ほど気持ちが強く、明るい星ほど最近の日記です。",
    showAxes: true,
  },
  {
    title: "星をタップしてみよう",
    body: "星をタップすると、その日に書いた日記が読めます。最初はサンプルの星が入っているので、気軽にのぞいてみてください。",
    target: "latest-star",
  },
  {
    title: "日記を書いてみよう",
    body: "ここから今日のひとことを書けます。書いた内容はこのブラウザの中だけに保存されます。",
    target: "add-button",
  },
];

const MARGIN = 16;
const GAP = 16;
const CARD_MAX_WIDTH = 340;
/** スポットライトの円の最小サイズ（小さい星でも見えるように） */
const MIN_SPOTLIGHT = 56;

type Rect = { top: number; left: number; width: number; height: number };

const isSameRect = (a: Rect | null, b: Rect | null) =>
  a?.top === b?.top && a?.left === b?.left && a?.width === b?.width && a?.height === b?.height;

const spotlightDiameter = (rect: Rect) =>
  Math.max(Math.max(rect.width, rect.height) + 16, MIN_SPOTLIGHT);

/**
 * data-tour で指定した要素の位置を追いかける。
 * 画面サイズの変更や星の再配置にもついていけるように、毎フレーム確認する。
 */
function useTargetRect(target: string | undefined) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!target) return;
    let frame = 0;
    let current: Rect | null = null;

    const update = () => {
      const r = document.querySelector(`[data-tour="${target}"]`)?.getBoundingClientRect();
      const next = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      if (!isSameRect(current, next)) {
        current = next;
        setRect(next);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frame);
  }, [target]);

  return target ? rect : null;
}

/** 画面全体に重ねる星空の軸 */
function Axes() {
  const label = "absolute text-xs tracking-wider text-indigo-200";
  return (
    <div className="pointer-events-none absolute inset-4" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-indigo-300/40" />
      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-indigo-300/40" />
      <span className={`${label} left-1 top-1/2 mt-2`}>← ネガティブ</span>
      <span className={`${label} right-1 top-1/2 mt-2`}>ポジティブ →</span>
      <span className={`${label} left-1/2 top-1 ml-2`}>↑ 元気</span>
      <span className={`${label} bottom-1 left-1/2 ml-2`}>↓ のんびり</span>
    </div>
  );
}

/** 対象の要素のまわりだけを丸く切り抜いて照らす */
function Spotlight({ rect }: { rect: Rect }) {
  const diameter = spotlightDiameter(rect);
  const style: CSSProperties = {
    top: rect.top + rect.height / 2 - diameter / 2,
    left: rect.left + rect.width / 2 - diameter / 2,
    width: diameter,
    height: diameter,
  };

  return (
    <div
      className="pointer-events-none fixed rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-300"
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full border-2 border-indigo-300/80" />
      <div className="absolute inset-0 animate-ping rounded-full border border-indigo-300/50" />
    </div>
  );
}

/** 画面の下に置くときの、下端からの距離（右下の ＋ ボタンにかぶらない高さ） */
const BOTTOM_OFFSET = 104;

/**
 * カードの位置。対象があればその近くに出す。
 * 軸を見せるときは、真ん中の軸にかぶらないように画面の下に出す。
 */
const cardPosition = (rect: Rect | null, showAxes: boolean): CSSProperties => {
  if (!rect) {
    return showAxes
      ? { left: "50%", bottom: BOTTOM_OFFSET, transform: "translateX(-50%)" }
      : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_MAX_WIDTH, vw - MARGIN * 2);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const left = Math.min(Math.max(centerX - width / 2, MARGIN), vw - width - MARGIN);
  const radius = spotlightDiameter(rect) / 2;

  // 対象が画面の下半分にあればカードを上に、上半分にあれば下に出す
  return centerY > vh / 2
    ? { left, bottom: vh - centerY + radius + GAP }
    : { left, top: centerY + radius + GAP };
};

export default function Tutorial({ onClose, onStartWriting }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const rect = useTargetRect(current.target);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // ページが変わったら、次に押すボタンにフォーカスを移す
  useEffect(() => {
    primaryRef.current?.focus();
  }, [step]);

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景のクリックを受け止める。スポットライトがあるときは、暗幕はその影で作る */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${rect ? "" : "bg-black/65"}`}
        onClick={onClose}
      />
      {current.showAxes && <Axes />}
      {rect && <Spotlight rect={rect} />}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="fixed rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-5 shadow-2xl"
        style={{
          width: `min(${CARD_MAX_WIDTH}px, calc(100vw - ${MARGIN * 2}px))`,
          ...cardPosition(rect, !!current.showAxes),
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="tutorial-title" className="text-base text-white">
            {current.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="cursor-pointer text-gray-400 hover:text-gray-300"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-gray-300">{current.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex items-center gap-4">
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
              ref={primaryRef}
              onClick={isLast ? onStartWriting : () => setStep(step + 1)}
              className="cursor-pointer rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {isLast ? "書いてみる" : "次へ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
