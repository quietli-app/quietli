"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
  currentUserId: string;
  profileUserId: string;
  initiallyFollowing: boolean;
};

export function FollowButton({
  currentUserId,
  profileUserId,
  initiallyFollowing,
}: FollowButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [isLoading, setIsLoading] = useState(false);

  async function toggleFollow() {
    if (isLoading) return;

    setIsLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profileUserId);

      if (error) {
        console.error("Error unfollowing user:", error);
        setIsLoading(false);
        return;
      }

      setIsFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: profileUserId,
      });

      if (error) {
        console.error("Error following user:", error);
        setIsLoading(false);
        return;
      }

      setIsFollowing(true);
    }

    setIsLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={isLoading}
      className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isFollowing
          ? "border-white/30 bg-white/20 text-white hover:bg-white/30"
          : "border-white/40 bg-white text-[#642B73] hover:bg-white/90"
      }`}
    >
      {isLoading ? "One sec..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}