"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

type FormData = {
  content: string;
};

export default function InputModal() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await axios.post("/api/diaries", data);

      reset();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* TODO: スタイルを整える */}
      {/* ＋ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full 
        bg-indigo-500 hover:bg-indigo-400 
        text-white text-2xl shadow-lg 
        flex items-center justify-center
        cursor-pointer"
      >
        ＋
      </button>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl 
            bg-gradient-to-b from-gray-900 to-black 
            shadow-2xl border border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h2 className="text-white text-lg mb-4">🌙 今日のひとこと</h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              <textarea
                {...register("content", { required: true })}
                placeholder="どんな1日だった？"
                className="w-full h-32 p-4 rounded-lg 
                bg-black text-white placeholder-gray-500 
                border border-gray-700 
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 w-full py-2 rounded-full 
                bg-indigo-500 hover:bg-indigo-400 
                disabled:opacity-50
                text-white font-medium
                cursor-pointer"
              >
                {isSubmitting ? "星を作っています..." : "星にする ✨"}
              </button>
            </form>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
