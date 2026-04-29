import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";
import { FollowButton } from "@/components/follow-button";

type FollowStatus = "none" | "pending" | "accepted";

type RawBlip = {
  user_id: string;
  content: string;
  created_at: string;
  profiles:
    | {
        username: string;
        avatar_url: string | null;
        bio: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }
    | {
        username: string;
        avatar_url: string | null;
        bio: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }[]
    | null;
};

type DiscoverProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  gradientTheme: string | null;
  profileVisibility: string | null;
  latestBlip: string;
  latestBlipAt: string;
  followStatus: FollowStatus;
};

export default async function DiscoverPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let blockedUserIds: string[] = [];

  if (user) {
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

    blockedUserIds =
      blocks?.map((block) =>
        block.blocker_id === user.id ? block.blocked_id : block.blocker_id
      ) ?? [];
  }

  const { data: blips } = await supabase
    .from("blips")
    .select(
      `
      user_id,
      content,
      created_at,
      profiles!inner(username, avatar_url, bio, gradient_theme, profile_visibility)
    `
    )
    .order("created_at", { ascending: false })
    .limit(120);

  const profileMap = new Map<string, DiscoverProfile>();

  (blips as RawBlip[] | null)?.forEach((blip) => {
    const profileData = Array.isArray(blip.profiles)
      ? blip.profiles[0]
      : blip.profiles;

    if (!profileData) return;
    if (profileData.profile_visibility === "private") return;
    if (user?.id === blip.user_id) return;
    if (blockedUserIds.includes(blip.user_id)) return;
    if (profileMap.has(blip.user_id)) return;

    profileMap.set(blip.user_id, {
      id: blip.user_id,
      username: profileData.username,
      avatarUrl: profileData.avatar_url,
      bio: profileData.bio,
      gradientTheme: profileData.gradient_theme,
      profileVisibility: profileData.profile_visibility ?? "public",
      latestBlip: blip.content,
      latestBlipAt: blip.created_at,
      followStatus: "none",
    });
  });

  let profiles = Array.from(profileMap.values()).slice(0, 30);

  if (user && profiles.length > 0) {
    const profileIds = profiles.map((profile) => profile.id);

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id, status")
      .eq("follower_id", user.id)
      .in("following_id", profileIds);

    profiles = profiles.map((profile) => {
      const follow = follows?.find(
        (item) => item.following_id === profile.id
      );

      const followStatus =
        follow?.status === "accepted" || follow?.status === "pending"
          ? follow.status
          : "none";

      return {
        ...profile,
        followStatus,
      };
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Discover
        </p>

        <h1 className="text-4xl font-bold">Find quiet corners.</h1>

        <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
          Browse recently active public profiles and follow the ones whose blips
          feel like something you want drifting through your feed.
        </p>
      </section>

      {profiles.length === 0 ? (
        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
          <h2 className="text-2xl font-bold">No public profiles yet.</h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
            Quiet out here. Once people start posting public blips, they’ll show
            up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => {
            const cardBackground =
              gradientThemes[profile.gradientTheme ?? "blush"] ??
              gradientThemes.blush;

            return (
              <article
                key={profile.id}
                className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl transition hover:bg-white/25"
              >
                <Link href={`/profile/${profile.username}`} className="block">
                  <div
                    className="rounded-[1.6rem] p-5"
                    style={{ background: cardBackground }}
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/30">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.username}
                            className="absolute inset-0 h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full text-xl font-bold text-[#2b0f2f]">
                            {profile.username.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xl font-bold text-[#2b0f2f]">
                          @{profile.username}
                        </p>

                        <p className="truncate text-sm text-[#2b0f2f]/75">
                          {profile.bio || "A stream of passing thoughts."}
                        </p>
                      </div>
                    </div>

                    <p className="line-clamp-3 text-base leading-7 text-[#2b0f2f]">
                      {profile.latestBlip}
                    </p>
                  </div>
                </Link>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/profile/${profile.username}`}
                    className="text-sm font-bold text-white/80 transition hover:text-white"
                  >
                    Visit profile →
                  </Link>

                  {user ? (
                    <FollowButton
                      currentUserId={user.id}
                      profileUserId={profile.id}
                      initialStatus={profile.followStatus}
                      profileVisibility={profile.profileVisibility}
                    />
                  ) : (
                    <Link
                      href="/login"
                      className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
                    >
                      Sign in to follow
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}