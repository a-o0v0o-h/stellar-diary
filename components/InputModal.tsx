"use client";

import { RiAddLine, RiCloseLine } from "react-icons/ri";
import { useForm, useWatch } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import type { AnalyzeResponse } from "@/app/api/analyze/route";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";
import type { Diary } from "@/lib/diaryStore";

type FormData = {
  content: string;
};

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: (diary: Diary) => void;
};

const ERROR_MESSAGES = {
  invalid: `${MAX_CONTENT_LENGTH}文字以内で入力してください。`,
  rate_limited: "今日つくれる星はここまでです。また明日書いてみてください。",
  unavailable: "いまは星をつくれません。時間をおいて試してください。",
} as const;

export default function InputModal({ isOpen, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const length = useWatch({ control, name: "content" })?.length ?? 0;

  const onSubmit = async (data: FormData) => {
    const content = data.content.trim();

    try {
      const res = await axios.post<AnalyzeResponse>(
        "/api/analyze",
        { content },
        { validateStatus: () => true },
      );

      if (!res.data?.isOk) {
        const reason = res.data?.reason ?? "unavailable";
        toast.error(ERROR_MESSAGES[reason]);
        return;
      }

      onCreated({
        id: crypto.randomUUID(),
        content,
        emotion: res.data.emotion,
        energy: res.data.energy,
        intensity: res.data.intensity,
        createdAt: new Date().toISOString(),
      });

      reset();
      onOpenChange(false);
      toast.success("星が生まれました");
    } catch (e) {
      console.error(e);
      toast.error("投稿に失敗しました。もう一度試してください。");
    }
  };

  return (
    <>
      {/* TODO: スタイルを整える */}
      {/* ＋ボタン */}
      <button
        onClick={() => onOpenChange(true)}
        data-tour="add-button"
        aria-label="日記を書く"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full
        bg-indigo-500 hover:bg-indigo-400
        text-white shadow-lg
        flex items-center justify-center
        cursor-pointer"
      >
        <RiAddLine size={28} />
      </button>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl
            bg-gradient-to-b from-gray-900 to-black
            shadow-2xl border border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">今日のひとこと</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <textarea
                {...register("content", {
                  required: true,
                  maxLength: MAX_CONTENT_LENGTH,
                  validate: (value) => value.trim().length > 0,
                })}
                maxLength={MAX_CONTENT_LENGTH}
                placeholder="どんな1日だった？"
                className="w-full h-32 p-4 rounded-lg
                bg-black text-white placeholder-gray-500
                border border-gray-700
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none"
              />
              <p className="mt-1 text-right text-xs text-gray-500">
                {length} / {MAX_CONTENT_LENGTH}
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full py-2 rounded-full
                bg-indigo-500 hover:bg-indigo-400
                disabled:opacity-50
                text-white font-medium
                cursor-pointer"
              >
                {isSubmitting ? "星を作っています..." : "星をつくる"}
              </button>
            </form>

            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              書いた内容はこのブラウザの中だけに保存されます。感情の解析のため、文章は
              OpenAI API に送信されます。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
