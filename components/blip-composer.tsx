"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BlipComposerProps = {
  userId: string;
  onPosted?: () => void | Promise<void>;
};

type PostBlipResult = {
  ok: boolean;
  reason?: string;
  message?: string;
  seconds_remaining?: number;
};

const MAX_LENGTH = 240;
const COOLDOWN_SECONDS = 10;

const HOURLY_LIMIT_MESSAGE =
  "Hey buddy, are you ok? Maybe you need to chill on the blips for a minute... Have a tea, maybe meditate for a bit? Lets put the blips down for a little bit and come back to it when you're more relaxed.";

export function BlipComposer({ onPosted }: BlipComposerProps) {
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function submitBlip() {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setMessage("Write a tiny thought first.");
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      setMessage(`Keep your blip under ${MAX_LENGTH} characters.`);
      return;
    }

    if (cooldownSeconds > 0) {
      setMessage(
        `Give it ${cooldownSeconds} more second${
          cooldownSeconds === 1 ? "" : "s"
        } before posting another blip.`
      );
      return;
    }

    if (isPosting) return;

    setIsPosting(true);
    setMessage("");

    const { data, error } = await supabase.rpc("post_blip", {
      p_content: trimmedContent,
    });

    setIsPosting(false);

    if (error) {
      console.error("Error posting blip:", error);
      setMessage("Something went wrong posting your blip.");
      return;
    }

    const result = data as PostBlipResult | null;

    if (!result?.ok) {
      if (result?.reason === "cooldown") {
        const secondsRemaining =
          typeof result.seconds_remaining === "number"
            ? result.seconds_remaining
            : COOLDOWN_SECONDS;

        setCooldownSeconds(secondsRemaining);
        setMessage(
          `Give it ${secondsRemaining} more second${
            secondsRemaining === 1 ? "" : "s"
          } before posting another blip.`
        );
        return;
      }

      if (result?.reason === "hourly_limit") {
        setMessage(HOURLY_LIMIT_MESSAGE);
        return;
      }

      if (result?.reason === "possible_bot_spam") {
        setMessage(
          "Quietli noticed a suspiciously fast burst of posting attempts. Posting has been paused for review."
        );
        return;
      }

      setMessage(result?.message ?? "Something went wrong posting your blip.");
      return;
    }

    setContent("");
    setCooldownSeconds(COOLDOWN_SECONDS);
    setMessage(result.message ?? "Blip posted.");

    if (onPosted) {
      await onPosted();
    }
  }

  async function postBlip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitBlip();
  }

  async function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key !== "Enter") return;

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    await submitBlip();
  }

  const charactersLeft = MAX_LENGTH - content.length;

  return (
    <form
      onSubmit={postBlip}
      className="mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl"
    >
      <label htmlFor="blip-content" className="sr-only">
        Write a blip
      </label>

      <textarea
        id="blip-content"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setMessage("");
        }}
        onKeyDown={handleKeyDown}
        maxLength={MAX_LENGTH}
        placeholder="What floated through your brain?"
        className="min-h-32 w-full resize-none rounded-[1.5rem] border border-white/20 bg-white/50 p-4 text-base font-light leading-7 tracking-[-0.01em] text-[#642B73] outline-none placeholder:text-base placeholder:font-light placeholder:tracking-[-0.01em] placeholder:text-[#8f6a99]/65"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-sm font-light ${
            charactersLeft < 20 ? "text-white" : "text-white/65"
          }`}
        >
          {charactersLeft} characters left
        </p>

        <button
          type="submit"
          disabled={isPosting || cooldownSeconds > 0}
          className="rounded-full bg-white px-5 py-2 text-sm font-normal text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPosting
            ? "Posting..."
            : cooldownSeconds > 0
              ? `Pause ${cooldownSeconds}s`
              : "Post blip"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-white/20 bg-white/15 p-3 text-sm font-normal leading-6 text-white/85">
          {message}
        </p>
      ) : null}
    </form>
  );
}