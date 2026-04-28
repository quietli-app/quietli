"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FollowRequest = {
  id: string;
  followerId: string;
  username: string;
  avatarUrl: string | null;
};

type FollowRequestsProps = {
  requests: FollowRequest[];
};

export function FollowRequests({ requests }: FollowRequestsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (requests.length === 0) {
    return null;
  }

  async function approveRequest(requestId: string) {
    setLoadingId(requestId);

    const { error } = await supabase
      .from("follows")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (error) {
      console.error("Error approving follow request:", error);
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  async function denyRequest(requestId: string) {
    setLoadingId(requestId);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", requestId);

    if (error) {
      console.error("Error denying follow request:", error);
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="relative rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <div className="absolute right-5 top-5 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e25561] px-2 text-xs font-extrabold text-white">
        {requests.length}
      </div>

      <div className="pr-12">
        <p className="mb-2 text-xl font-bold text-white">Follow requests</p>

        <p className="mb-4 text-base leading-7 text-slate-100">
          These people asked to follow your private Quietli page.
        </p>
      </div>

      <div className="grid gap-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/15 bg-white/15 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/35 bg-white/25">
                {request.avatarUrl ? (
                  <img
                    src={request.avatarUrl}
                    alt={request.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {request.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <p className="font-bold text-white">@{request.username}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approveRequest(request.id)}
                disabled={loadingId === request.id}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={() => denyRequest(request.id)}
                disabled={loadingId === request.id}
                className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}