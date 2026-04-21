"use client";

import { useState } from "react";
import { RiAddLine, RiCloseLine } from "react-icons/ri";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";

type FormData = {
  content: string;
};

export default function InputModal() {
  const router = useRouter();
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
      router.refresh();
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">今日のひとこと</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

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
          </div>
        </div>
      )}
    </>
  );
}
