"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BlockButtonProps = {
  currentUserId: string;
  profileUserId: string;
  initiallyBlocked: boolean;
};

export function BlockButton({
  currentUserId,
  profileUserId,
  initiallyBlocked,
}: BlockButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isBlocked, setIsBlocked] = useState(initiallyBlocked);
  const [isLoading, setIsLoading] = useState(false);

  async function toggleBlock() {
    if (isLoading) return;

    if (!isBlocked) {
      const confirmed = window.confirm(
        "Block this user? They will not be notified. This will also remove any follow relationship between you."
      );

      if (!confirmed) return;
    }

    setIsLoading(true);

    if (isBlocked) {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", profileUserId);

      if (error) {
        console.error("Error unblocking user:", error);
        setIsLoading(false);
        return;
      }

      setIsBlocked(false);
      setIsLoading(false);
      router.refresh();
      return;
    }

    const { error: blockError } = await supabase.from("blocks").insert({
      blocker_id: currentUserId,
      blocked_id: profileUserId,
    });

    if (blockError) {
      console.error("Error blocking user:", blockError);
      setIsLoading(false);
      return;
    }

    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", profileUserId);

    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", profileUserId)
      .eq("following_id", currentUserId);

    setIsBlocked(true);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleBlock}
      disabled={isLoading}
      className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isBlocked
          ? "border-white/30 bg-white/20 text-white hover:bg-white/30"
          : "border-white/30 bg-[#e25561]/80 text-white hover:bg-[#e25561]"
      }`}
    >
      {isLoading ? "One sec..." : isBlocked ? "Unblock" : "Block"}
    </button>
  );
}