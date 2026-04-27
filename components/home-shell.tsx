"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { BlipComposer } from "@/components/blip-composer";
import { BlipCard } from "@/components/blip-card";

type FeedItem = {
  id: string;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
};

export function HomeShell({ initialFeed }: { initialFeed: FeedItem[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [feed, setFeed] = useState(initialFeed);
  const [profile, setProfile] = useState<{ id: string; username: string | null } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  async function refreshFeed() {
    const { data } = await supabase
      .from("blips")
      .select(
        `
        id,
        content,
        created_at,
        profiles!inner(id, username, avatar_url)
        `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    const nextFeed =
      data?.map((blip) => {
        const profileData = Array.isArray(blip.profiles) ? blip.profiles[0] : blip.profiles;
        return {
          id: blip.id,
          content: blip.content,
          createdAt: blip.created_at,
          username: profileData?.username ?? "unknown",
          avatarUrl: profileData?.avatar_url ?? null,
        };
      }) ?? [];

    setFeed(nextFeed);
  }

  useEffect(() => {
    let mounted = true;

    async function loadCurrentProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setProfile(null);
        setAuthChecked(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .single();

      if (!mounted) return;
      setProfile(data ?? null);
      setAuthChecked(true);
    }

    void loadCurrentProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCurrentProfile();
      void refreshFeed();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10">
        <h1 className="text-5xl font-bold tracking-tight text-white">Brain Blip</h1>
        <p className="mt-4 max-w-3xl text-xl muted">
          A non-social social feed for small passing thoughts. No scores. No reactions. No performance.
        </p>
      </section>

      {authChecked && profile ? (
        <BlipComposer userId={profile.id} onPosted={refreshFeed} />
      ) : (
        <div className="panel mb-8 rounded-[2rem] p-5 text-lg text-white/90">
          Sign in to post a blip.
        </div>
      )}

      <div className="grid gap-4">
        {feed.map((blip) => (
          <BlipCard
            key={blip.id}
            content={blip.content}
            createdAt={blip.createdAt}
            username={blip.username}
            avatarUrl={blip.avatarUrl}
          />
        ))}
      </div>
    </main>
  );
}
