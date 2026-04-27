"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BlipComposerProps = {
  userId: string;
  onPosted?: () => void | Promise<void>;
};

export function BlipComposer({ userId, onPosted }: BlipComposerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const maxLength = 240;

  async function postBlip() {
    const trimmedContent = content.trim();

    if (!trimmedContent) return;
    if (trimmedContent.length > maxLength) return;

    setIsPosting(true);
    setErrorMessage("");

    const { error } = await supabase.from("blips").insert({
      user_id: userId,
      content: trimmedContent,
    });

    if (error) {
      console.error("Error posting blip:", error);
      setErrorMessage("Something went wrong while posting your blip.");
      setIsPosting(false);
      return;
    }

    setContent("");
    setIsPosting(false);

    if (onPosted) {
      await onPosted();
    } else {
      router.refresh();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      postBlip();
    }
  }

  return (
    <div className="mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
      <label
        htmlFor="blip-content"
        className="mb-4 block text-lg font-bold text-white"
      >
        What floated through your brain?
      </label>

      <textarea
        id="blip-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        placeholder="A passing thought, a soft observation, a tiny idea..."
        className="min-h-[140px] w-full resize-none rounded-[1.5rem] border border-white/30 bg-white/60 px-5 py-4 text-lg text-[#642B73] outline-none placeholder:text-[#8f6a99]"
      />

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-white/80">
          {content.length}/{maxLength}
        </p>

        <button
          type="button"
          onClick={postBlip}
          disabled={isPosting || !content.trim()}
          className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-6 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPosting ? "Posting..." : "Post blip"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-100">{errorMessage}</p>
      ) : null}
    </div>
  );
}