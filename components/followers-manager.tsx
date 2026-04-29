"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Follower = {
  followId: string;
  followerId: string;
  username: string;
  avatarUrl: string | null;
};

type FollowersManagerProps = {
  followers: Follower[];
};

export function FollowersManager({ followers }: FollowersManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (followers.length === 0) {
    return null;
  }

  async function removeFollower(followId: string) {
    const confirmed = window.confirm(
      "Remove this follower? They will not be notified."
    );

    if (!confirmed) return;

    setLoadingId(followId);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", followId);

    if (error) {
      console.error("Error removing follower:", error);
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Followers</p>

      <p className="mb-4 text-base leading-7 text-slate-100">
        Silently remove someone from your followers. They will not be notified.
      </p>

      <div className="grid gap-3">
        {followers.map((follower) => (
          <div
            key={follower.followId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/15 bg-white/15 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/35 bg-white/25">
                {follower.avatarUrl ? (
                  <img
                    src={follower.avatarUrl}
                    alt={follower.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {follower.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <p className="font-bold text-white">@{follower.username}</p>
            </div>

            <button
              type="button"
              onClick={() => removeFollower(follower.followId)}
              disabled={loadingId === follower.followId}
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingId === follower.followId ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}