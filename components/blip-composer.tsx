"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BlipComposerProps = {
  userId: string;
  onPosted?: () => void | Promise<void>;
};

const MAX_LENGTH = 240;
const COOLDOWN_SECONDS = 30;
const MAX_BLIPS_PER_HOUR = 20;

export function BlipComposer({ userId, onPosted }: BlipComposerProps) {
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

  async function getRecentBlipStatus() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from("blips")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("created_at", oneHourAgo);

    if (countError) {
      console.error("Error checking hourly blip count:", countError);

      return {
        canPost: true,
        reason: "",
      };
    }

    if ((count ?? 0) >= MAX_BLIPS_PER_HOUR) {
      return {
        canPost: false,
        reason:
          "You’ve reached the current limit of 20 blips per hour. Give it a little time before posting again.",
      };
    }

    const { data: latestBlip, error: latestError } = await supabase
      .from("blips")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error("Error checking latest blip:", latestError);

      return {
        canPost: true,
        reason: "",
      };
    }

    if (latestBlip?.created_at) {
      const lastPostTime = new Date(latestBlip.created_at).getTime();
      const secondsSinceLastPost = Math.floor(
        (Date.now() - lastPostTime) / 1000
      );
      const remainingSeconds = COOLDOWN_SECONDS - secondsSinceLastPost;

      if (remainingSeconds > 0) {
        setCooldownSeconds(remainingSeconds);

        return {
          canPost: false,
          reason: `Give it ${remainingSeconds} more second${
            remainingSeconds === 1 ? "" : "s"
          } before posting another blip.`,
        };
      }
    }

    return {
      canPost: true,
      reason: "",
    };
  }

  async function postBlip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    setIsPosting(true);
    setMessage("");

    const recentStatus = await getRecentBlipStatus();

    if (!recentStatus.canPost) {
      setMessage(recentStatus.reason);
      setIsPosting(false);
      return;
    }

    const { error } = await supabase.from("blips").insert({
      user_id: userId,
      content: trimmedContent,
    });

    setIsPosting(false);

    if (error) {
      console.error("Error posting blip:", error);

      if (
        error.message.toLowerCase().includes("policy") ||
        error.message.toLowerCase().includes("row-level security")
      ) {
        setMessage(
          "Quietli is asking for a tiny pause before your next blip. Try again in a moment."
        );
        setCooldownSeconds(COOLDOWN_SECONDS);
        return;
      }

      setMessage("Something went wrong posting your blip.");
      return;
    }

    setContent("");
    setCooldownSeconds(COOLDOWN_SECONDS);
    setMessage("Blip posted.");

    if (onPosted) {
      await onPosted();
    }
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
        maxLength={MAX_LENGTH}
        placeholder="What floated through your brain?"
        className="min-h-32 w-full resize-none rounded-[1.5rem] border border-white/20 bg-white/50 p-4 text-lg font-normal text-[#642B73] outline-none placeholder:text-[#8f6a99]"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-sm font-normal ${
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