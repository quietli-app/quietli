"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ModerationReviewButtonProps = {
  flagId: string;
};

type ReviewResult = {
  ok: boolean;
  message?: string;
};

export function ModerationReviewButton({ flagId }: ModerationReviewButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [note, setNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [message, setMessage] = useState("");

  async function markReviewed() {
    setIsReviewing(true);
    setMessage("");

    const { data, error } = await supabase.rpc("review_moderation_flag", {
      p_flag_id: flagId,
      p_reviewer_note: note,
    });

    setIsReviewing(false);

    if (error) {
      console.error("Error reviewing moderation flag:", error);
      setMessage("Could not mark this flag as reviewed.");
      return;
    }

    const result = data as ReviewResult | null;

    if (!result?.ok) {
      setMessage(result?.message ?? "Could not mark this flag as reviewed.");
      return;
    }

    setNote("");
    setMessage("Marked as reviewed.");
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-3">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional reviewer note"
        className="min-h-20 w-full resize-none rounded-2xl border border-white/20 bg-white/50 p-3 text-sm font-normal text-[#642B73] outline-none placeholder:text-[#8f6a99]/70"
      />

      <button
        type="button"
        onClick={markReviewed}
        disabled={isReviewing}
        className="w-fit rounded-full bg-white px-5 py-2 text-sm font-normal text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isReviewing ? "Reviewing..." : "Mark reviewed"}
      </button>

      {message ? <p className="text-sm text-white/75">{message}</p> : null}
    </div>
  );
}