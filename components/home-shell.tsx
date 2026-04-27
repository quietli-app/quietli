"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BlipComposer } from "@/components/blip-composer";
import { BlipCard } from "@/components/blip-card";

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
      }
    | {
        username: string;
        avatar_url: string | null;
        gradient_theme: string | null;
      }[]
    | null;
};

export function HomeShell() {
  const supabase = createClient();

  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setAuthChecked(true);
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
      return;
    }

    setProfile(data);
    setAuthChecked(true);
  }

  async function loadFeed() {
    setLoadingFeed(true);

    const { data, error } = await supabase
      .from("blips")
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        profiles!inner(username, avatar_url, gradient_theme)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading feed:", error);
      setFeed([]);
      setLoadingFeed(false);
      return;
    }

    const formattedFeed: FeedItem[] =
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
        };
      }) ?? [];

    setFeed(formattedFeed);
    setLoadingFeed(false);
  }

  async function refreshFeed() {
    await loadFeed();
  }

  useEffect(() => {
    loadProfile();
    loadFeed();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {authChecked && profile ? (
        <BlipComposer userId={profile.id} onPosted={refreshFeed} />
      ) : (
        <div className="mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-5 text-lg text-white/90 backdrop-blur-xl">
          Sign in to post a blip.
        </div>
      )}

      {loadingFeed ? (
        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white/80 backdrop-blur-xl">
          Loading blips...
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