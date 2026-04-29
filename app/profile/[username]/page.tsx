import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlipCard } from "@/components/blip-card";
import { AvatarUpload } from "@/components/avatar-upload";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileEditor } from "@/components/profile-editor";
import { GradientThemePicker } from "@/components/gradient-theme-picker";
import { EmbedCodeBox } from "@/components/embed-code-box";
import { ProfileNavTheme } from "@/components/profile-nav-theme";
import { FollowButton } from "@/components/follow-button";
import { MuteButton } from "@/components/mute-button";
import { BlockButton } from "@/components/block-button";
import { FollowRequests } from "@/components/follow-requests";
import { FollowersManager } from "@/components/followers-manager";
import { ProfilePrivacyToggle } from "@/components/profile-privacy-toggle";
import { profileBackgroundThemes } from "@/lib/gradient-themes";

type FollowStatus = "none" | "pending" | "accepted";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { username } = await params;
  const { preview } = await searchParams;

  const isPublicPreview = preview === "public";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, gradient_theme, profile_visibility")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user?.id === profile.id;
  const showOwnerControls = isOwnProfile && !isPublicPreview;

  const activeTheme = profile.gradient_theme ?? "blush";

  const profileBackground =
    profileBackgroundThemes[activeTheme] ?? profileBackgroundThemes.blush;

  let followStatus: FollowStatus = "none";
  let initiallyMuted = false;
  let initiallyBlocked = false;
  let blockedByProfileOwner = false;

  if (user && !isOwnProfile) {
    const { data: follow } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();

    if (follow?.status === "accepted" || follow?.status === "pending") {
      followStatus = follow.status;
    }

    const { data: mute } = await supabase
      .from("mutes")
      .select("id")
      .eq("muter_id", user.id)
      .eq("muted_id", profile.id)
      .maybeSingle();

    initiallyMuted = Boolean(mute);

    const { data: blockMadeByViewer } = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", profile.id)
      .maybeSingle();

    initiallyBlocked = Boolean(blockMadeByViewer);

    const { data: blockMadeByProfileOwner } = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", profile.id)
      .eq("blocked_id", user.id)
      .maybeSingle();

    blockedByProfileOwner = Boolean(blockMadeByProfileOwner);
  }

  const hasBlockBetweenUsers = initiallyBlocked || blockedByProfileOwner;

  const canViewBlips =
    !hasBlockBetweenUsers &&
    (profile.profile_visibility === "public" ||
      isOwnProfile ||
      followStatus === "accepted");

  const { data: blips } = canViewBlips
    ? await supabase
        .from("blips")
        .select("id, user_id, content, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  let followRequests:
    | {
        id: string;
        followerId: string;
        username: string;
        avatarUrl: string | null;
      }[]
    = [];

  let followers:
    | {
        followId: string;
        followerId: string;
        username: string;
        avatarUrl: string | null;
      }[]
    = [];

  if (showOwnerControls) {
    const { data: pendingRequests } = await supabase
      .from("follows")
      .select("id, follower_id")
      .eq("following_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const followerRequestIds =
      pendingRequests?.map((request) => request.follower_id) ?? [];

    if (followerRequestIds.length > 0) {
      const { data: requestProfiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followerRequestIds);

      followRequests =
        pendingRequests?.map((request) => {
          const requestProfile = requestProfiles?.find(
            (item) => item.id === request.follower_id
          );

          return {
            id: request.id,
            followerId: request.follower_id,
            username: requestProfile?.username ?? "unknown",
            avatarUrl: requestProfile?.avatar_url ?? null,
          };
        }) ?? [];
    }

    const { data: acceptedFollowers } = await supabase
      .from("follows")
      .select("id, follower_id")
      .eq("following_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    const acceptedFollowerIds =
      acceptedFollowers?.map((follow) => follow.follower_id) ?? [];

    if (acceptedFollowerIds.length > 0) {
      const { data: followerProfiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", acceptedFollowerIds);

      followers =
        acceptedFollowers?.map((follow) => {
          const followerProfile = followerProfiles?.find(
            (item) => item.id === follow.follower_id
          );

          return {
            followId: follow.id,
            followerId: follow.follower_id,
            username: followerProfile?.username ?? "unknown",
            avatarUrl: followerProfile?.avatar_url ?? null,
          };
        }) ?? [];
    }
  }

  const accentColor = "#ffffff";

  return (
    <>
      <ProfileNavTheme
        siteBackground={profileBackground}
        navBackground="rgba(255, 255, 255, 0.10)"
      />

      <main
        className="profile-theme-page min-h-screen px-4 py-10"
        style={
          {
            "--profile-gradient": profileBackground,
          } as React.CSSProperties
        }
      >
        <div className="mx-auto max-w-5xl">
          <section className="relative mb-8 rounded-[2rem] border border-white/20 bg-white/20 p-6 backdrop-blur-xl">
            <div className="absolute right-5 top-5">
              {isOwnProfile ? (
                isPublicPreview ? (
                  <Link
                    href={`/profile/${profile.username}`}
                    className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
                  >
                    Back to editor
                  </Link>
                ) : (
                  <Link
                    href={`/profile/${profile.username}?preview=public`}
                    className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
                  >
                    Public preview
                  </Link>
                )
              ) : user ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {!blockedByProfileOwner ? (
                    <>
                      {!initiallyBlocked ? (
                        <>
                          <FollowButton
                            currentUserId={user.id}
                            profileUserId={profile.id}
                            initialStatus={followStatus}
                            profileVisibility={profile.profile_visibility}
                          />

                          <MuteButton
                            currentUserId={user.id}
                            profileUserId={profile.id}
                            initiallyMuted={initiallyMuted}
                          />
                        </>
                      ) : null}

                      <BlockButton
                        currentUserId={user.id}
                        profileUserId={profile.id}
                        initiallyBlocked={initiallyBlocked}
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
                >
                  Sign in to follow
                </Link>
              )}
            </div>

            <div className="flex items-center gap-5 pr-40">
              <div
                style={{
                  padding: "3px",
                  borderRadius: "9999px",
                  background: accentColor,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        fontWeight: "600",
                        color: accentColor,
                      }}
                    >
                      {profile.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold text-white">
                    @{profile.username}
                  </h1>

                  {profile.profile_visibility === "private" ? (
                    <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                      Private
                    </span>
                  ) : null}
                </div>

                <p className="text-slate-100">
                  {profile.bio || "A stream of passing thoughts."}
                </p>
              </div>
            </div>

            {showOwnerControls ? (
              <div className="mt-6 grid gap-4">
                <AvatarUpload userId={profile.id} />

                <ProfileEditor
                  userId={profile.id}
                  currentUsername={profile.username}
                  currentBio={profile.bio}
                />

                <ProfilePrivacyToggle
                  userId={profile.id}
                  currentVisibility={profile.profile_visibility}
                />

                <FollowRequests requests={followRequests} />

                <FollowersManager followers={followers} />

                <GradientThemePicker
                  userId={profile.id}
                  currentTheme={profile.gradient_theme}
                />

                <EmbedCodeBox username={profile.username} />

                <ThemeToggle />
              </div>
            ) : null}
          </section>

          {blockedByProfileOwner ? (
            <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
              <h2 className="text-2xl font-bold">This profile is unavailable.</h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                You cannot view this Quietli page.
              </p>
            </div>
          ) : initiallyBlocked ? (
            <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
              <h2 className="text-2xl font-bold">You blocked this user.</h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                Unblock them if you want to view or follow this profile again.
              </p>
            </div>
          ) : !canViewBlips ? (
            <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
              <h2 className="text-2xl font-bold">This profile is private.</h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                Request to follow @{profile.username} to see their blips if they
                approve your request.
              </p>
            </div>
          ) : blips && blips.length > 0 ? (
            <div className="grid gap-4">
              {blips.map((blip) => (
                <BlipCard
                  key={blip.id}
                  id={blip.id}
                  content={blip.content}
                  createdAt={blip.created_at}
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  gradientTheme={profile.gradient_theme}
                  canDelete={showOwnerControls && user?.id === blip.user_id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
              <h2 className="text-2xl font-bold">No blips yet.</h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                This quiet corner is still empty.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}