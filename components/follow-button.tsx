"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FollowStatus = "none" | "pending" | "accepted";

type FollowButtonProps = {
  currentUserId: string;
  profileUserId: string;
  initialStatus: FollowStatus;
  profileVisibility?: string | null;
};

export function FollowButton({
  currentUserId,
  profileUserId,
  initialStatus,
  profileVisibility,
}: FollowButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const isPrivateProfile = profileVisibility === "private";

  async function toggleFollow() {
    if (isLoading) return;

    setIsLoading(true);

    if (status === "accepted" || status === "pending") {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profileUserId);

      if (error) {
        console.error("Error removing follow:", error);
        setIsLoading(false);
        return;
      }

      setStatus("none");
      setIsLoading(false);
      router.refresh();
      return;
    }

    const nextStatus = isPrivateProfile ? "pending" : "accepted";

    const { error } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: profileUserId,
      status: nextStatus,
    });

    if (error) {
      console.error("Error following user:", error);
      setIsLoading(false);
      return;
    }

    setStatus(nextStatus);
    setIsLoading(false);
    router.refresh();
  }

  const buttonText =
    isLoading
      ? "One sec..."
      : status === "accepted"
        ? "Following"
        : status === "pending"
          ? "Requested"
          : isPrivateProfile
            ? "Request follow"
            : "Follow";

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={isLoading}
      className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
        status === "accepted" || status === "pending"
          ? "border-white/30 bg-white/20 text-white hover:bg-white/30"
          : "border-white/40 bg-white text-[#642B73] hover:bg-white/90"
      }`}
    >
      {buttonText}
    </button>
  );
}