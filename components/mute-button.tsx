"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MuteButtonProps = {
  currentUserId: string;
  profileUserId: string;
  initiallyMuted: boolean;
};

export function MuteButton({
  currentUserId,
  profileUserId,
  initiallyMuted,
}: MuteButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isMuted, setIsMuted] = useState(initiallyMuted);
  const [isLoading, setIsLoading] = useState(false);

  async function toggleMute() {
    if (isLoading) return;

    setIsLoading(true);

    if (isMuted) {
      const { error } = await supabase
        .from("mutes")
        .delete()
        .eq("muter_id", currentUserId)
        .eq("muted_id", profileUserId);

      if (error) {
        console.error("Error unmuting user:", error);
        setIsLoading(false);
        return;
      }

      setIsMuted(false);
      setIsLoading(false);
      router.refresh();
      return;
    }

    const { error } = await supabase.from("mutes").insert({
      muter_id: currentUserId,
      muted_id: profileUserId,
    });

    if (error) {
      console.error("Error muting user:", error);
      setIsLoading(false);
      return;
    }

    setIsMuted(true);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleMute}
      disabled={isLoading}
      className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isMuted
          ? "border-white/30 bg-white/20 text-white hover:bg-white/30"
          : "border-white/30 bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {isLoading ? "One sec..." : isMuted ? "Unmute" : "Mute"}
    </button>
  );
}