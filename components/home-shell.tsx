"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BlipComposer } from "@/components/blip-composer";
import { BlipCard } from "@/components/blip-card";

type FeedView = "following" | "world";

type UserProfile = {
  id: string;
  username: string;
};

type FeedItem = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  gradientTheme?: string | null;
  profileVisibility?: string | null;
};

type RawBlip = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles:
    | {
        username: string;
        avatar_url: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }
    | {
        username: string;
        avatar_url: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }[]
    | null;
};

export function HomeShell() {
  const supabase = createClient();

  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedView, setFeedView] = useState<FeedView>("following");

  async function getFollowingIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .eq("status", "accepted");

    if (error) {
      console.error("Error loading following list:", error);
      return [];
    }

    return data?.map((follow) => follow.following_id) ?? [];
  }

  async function getMutedIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("mutes")
      .select("muted_id")
      .eq("muter_id", currentUserId);

    if (error) {
      console.error("Error loading muted users:", error);
      return [];
    }

    return data?.map((mute) => mute.muted_id) ?? [];
  }

  async function getBlockedUserIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);

    if (error) {
      console.error("Error loading blocked users:", error);
      return [];
    }

    return (
      data?.map((block) =>
        block.blocker_id === currentUserId ? block.blocked_id : block.blocker_id
      ) ?? []
    );
  }

  async function loadFeed(view: FeedView, currentProfile: UserProfile | null) {
    setLoadingFeed(true);

    let followingIds: string[] = [];
    let mutedIds: string[] = [];
    let blockedUserIds: string[] = [];

    if (currentProfile?.id) {
      mutedIds = await getMutedIds(currentProfile.id);
      blockedUserIds = await getBlockedUserIds(currentProfile.id);
    }

    if (view === "following") {
      if (!currentProfile?.id) {
        setFeed([]);
        setLoadingFeed(false);
        return;
      }

      followingIds = await getFollowingIds(currentProfile.id);

      if (followingIds.length === 0) {
        setFeed([]);
        setLoadingFeed(false);
        return;
      }
    }

    let query = supabase
      .from("blips")
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        profiles!inner(username, avatar_url, gradient_theme, profile_visibility)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (view === "following") {
      query = query.in("user_id", followingIds);
    }

    if (mutedIds.length > 0) {
      query = query.not("user_id", "in", `(${mutedIds.join(",")})`);
    }

    if (blockedUserIds.length > 0) {
      query = query.not("user_id", "in", `(${blockedUserIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading feed:", error);
      setFeed([]);
      setLoadingFeed(false);
      return;
    }

    let formattedFeed: FeedItem[] =
      (data as RawBlip[] | null)?.map((blip) => {
        const profileData = Array.isArray(blip.profiles)
          ? blip.profiles[0]
          : blip.profiles;

        return {
          id: blip.id,
          userId: blip.user_id,
          content: blip.content,
          createdAt: blip.created_at,
          username: profileData?.username ?? "unknown",
          avatarUrl: profileData?.avatar_url ?? null,
          gradientTheme: profileData?.gradient_theme ?? "blush",
          profileVisibility: profileData?.profile_visibility ?? "public",
        };
      }) ?? [];

    if (view === "world") {
      formattedFeed = formattedFeed.filter(
        (blip) => blip.profileVisibility !== "private"
      );
    }

    setFeed(formattedFeed);
    setLoadingFeed(false);
  }

  async function refreshFeed() {
    await loadFeed(feedView, profile);
  }

  async function changeFeedView(view: FeedView) {
    setFeedView(view);
    await loadFeed(view, profile);
  }

  useEffect(() => {
    async function initialLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setAuthChecked(true);
        setFeedView("world");
        await loadFeed("world", null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Error loading profile:", error);
        setProfile(null);
        setAuthChecked(true);
        setFeedView("world");
        await loadFeed("world", null);
        return;
      }

      setProfile(data);
      setAuthChecked(true);
      setFeedView("following");
      await loadFeed("following", data);
    }

    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {authChecked && profile ? (
        <BlipComposer userId={profile.id} onPosted={refreshFeed} />
      ) : (
        <div className="mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-5 text-lg font-normal text-white/90 backdrop-blur-xl">
          Sign in to post a blip.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full border border-white/20 bg-white/15 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => changeFeedView("following")}
            disabled={!profile}
            className={`rounded-full px-5 py-2 text-sm font-normal transition disabled:cursor-not-allowed disabled:opacity-50 ${
              feedView === "following"
                ? "bg-white text-[#642B73]"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            Following
          </button>

          <button
            type="button"
            onClick={() => changeFeedView("world")}
            className={`rounded-full px-5 py-2 text-sm font-normal transition ${
              feedView === "world"
                ? "bg-white text-[#642B73]"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            World View
          </button>
        </div>

        {feedView === "following" && profile ? (
          <p className="text-sm font-normal text-white/70">
            Blips from the quiet corners you follow.
          </p>
        ) : feedView === "world" ? (
          <p className="text-sm font-normal text-white/70">
            The latest public blips drifting through Quietli.
          </p>
        ) : null}
      </div>

      {loadingFeed ? (
        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-5 font-normal text-white/80 backdrop-blur-xl">
          Loading blips...
        </div>
      ) : feed.length === 0 ? (
        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center font-normal text-white backdrop-blur-xl">
          {feedView === "following" ? (
            <>
              <h2 className="text-2xl font-semibold">
                You’re not following anyone yet.
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm font-normal leading-6 text-white/75">
                Visit someone’s profile and tap Follow. Their blips will start
                showing up here.
              </p>

              <button
                type="button"
                onClick={() => changeFeedView("world")}
                className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-normal text-[#642B73] transition hover:bg-white/90"
              >
                View World
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">No public blips yet.</h2>

              <p className="mx-auto mt-3 max-w-xl text-sm font-normal leading-6 text-white/75">
                Quiet out here. Be the first to toss a thought into the world.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {feed.map((blip) => (
            <BlipCard
              key={blip.id}
              id={blip.id}
              content={blip.content}
              createdAt={blip.createdAt}
              username={blip.username}
              avatarUrl={blip.avatarUrl}
              gradientTheme={blip.gradientTheme}
              canDelete={profile?.id === blip.userId}
            />
          ))}
        </div>
      )}
    </main>
  );
}