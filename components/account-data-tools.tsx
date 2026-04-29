"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountDataToolsProps = {
  userId: string;
  email: string | null;
};

type ProfileData = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  gradient_theme: string | null;
  profile_visibility: string | null;
  profile_link_label: string | null;
  profile_link_url: string | null;
  created_at?: string | null;
};

type BlipData = {
  id: string;
  content: string;
  created_at: string;
};

type FollowData = {
  id: string;
  follower_id: string;
  following_id: string;
  status: string | null;
  created_at: string | null;
};

type MuteData = {
  id: string;
  muter_id: string;
  muted_id: string;
  created_at: string | null;
};

type BlockData = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string | null;
};

type ModerationFlagData = {
  id: string;
  user_id: string;
  flag_type: string;
  reason: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewer_note: string | null;
};

export function AccountDataTools({ userId, email }: AccountDataToolsProps) {
  const supabase = createClient();

  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function downloadJson(filename: string, data: unknown) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function exportData() {
    setIsExporting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const [
        profileResult,
        blipsResult,
        followingResult,
        followersResult,
        mutesResult,
        blockedUsersResult,
        blockedByResult,
        moderationFlagsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username, avatar_url, bio, gradient_theme, profile_visibility, profile_link_label, profile_link_url, created_at"
          )
          .eq("id", userId)
          .maybeSingle(),

        supabase
          .from("blips")
          .select("id, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("follows")
          .select("id, follower_id, following_id, status, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("follows")
          .select("id, follower_id, following_id, status, created_at")
          .eq("following_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("mutes")
          .select("id, muter_id, muted_id, created_at")
          .eq("muter_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("blocks")
          .select("id, blocker_id, blocked_id, created_at")
          .eq("blocker_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("blocks")
          .select("id, blocker_id, blocked_id, created_at")
          .eq("blocked_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("moderation_flags")
          .select(
            "id, user_id, flag_type, reason, created_at, reviewed, reviewed_at, reviewer_note"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const possibleError =
        profileResult.error ||
        blipsResult.error ||
        followingResult.error ||
        followersResult.error ||
        mutesResult.error ||
        blockedUsersResult.error ||
        blockedByResult.error ||
        moderationFlagsResult.error;

      if (possibleError) {
        console.error("Export error:", possibleError);
        setErrorMessage("Something went wrong while exporting your data.");
        setIsExporting(false);
        return;
      }

      const profile = profileResult.data as ProfileData | null;
      const usernameForFile = profile?.username || "quietli-user";
      const exportDate = new Date().toISOString();

      const exportPayload = {
        exported_at: exportDate,
        account: {
          user_id: userId,
          email,
        },
        profile,
        blips: (blipsResult.data ?? []) as BlipData[],
        following: (followingResult.data ?? []) as FollowData[],
        followers: (followersResult.data ?? []) as FollowData[],
        mutes: (mutesResult.data ?? []) as MuteData[],
        blocks: {
          users_you_blocked: (blockedUsersResult.data ?? []) as BlockData[],
          users_who_blocked_you: (blockedByResult.data ?? []) as BlockData[],
        },
        moderation_flags:
          (moderationFlagsResult.data ?? []) as ModerationFlagData[],
        notes: [
          "This export contains data available to your Quietli account.",
          "Some authentication/security data is managed by Supabase and may not appear in this export.",
        ],
      };

      const safeDate = exportDate.slice(0, 10);
      downloadJson(`quietli-export-${usernameForFile}-${safeDate}.json`, exportPayload);

      setMessage("Your Quietli data export has been downloaded.");
    } catch (error) {
      console.error("Unexpected export error:", error);
      setErrorMessage("Something went wrong while exporting your data.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Export your data</h2>

        <p className="mt-3 text-base font-normal leading-7 text-white/75">
          Download a JSON copy of your Quietli profile, blips, follows,
          followers, mutes, blocks, and any moderation flags connected to your
          account.
        </p>

        <button
          type="button"
          onClick={exportData}
          disabled={isExporting}
          className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-normal text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Preparing export..." : "Export my Quietli data"}
        </button>

        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-100/30 bg-emerald-100/15 p-4 text-sm font-normal leading-6 text-emerald-50">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm font-normal leading-6 text-red-50">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-red-100/25 bg-red-100/10 p-6 text-white backdrop-blur-xl">
        <p className="mb-2 text-sm font-normal uppercase tracking-[0.18em] text-red-50/75">
          Danger zone
        </p>

        <h2 className="text-2xl font-semibold">Delete account</h2>

        <p className="mt-3 text-base font-normal leading-7 text-white/75">
          Account deletion is coming next. Because this permanently removes your
          profile, blips, follows, followers, mutes, blocks, profile links, and
          login account, we’re keeping this disabled until the delete flow is
          fully tested on a spare account.
        </p>

        <button
          type="button"
          disabled
          className="mt-5 cursor-not-allowed rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-normal text-white/50"
        >
          Delete account coming soon
        </button>
      </section>
    </div>
  );
}