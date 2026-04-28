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
import { profileBackgroundThemes } from "@/lib/gradient-themes";

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
    .select("id, username, avatar_url, bio, gradient_theme")
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

  const { data: blips } = await supabase
    .from("blips")
    .select("id, user_id, content, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  let initiallyFollowing = false;

  if (user && !isOwnProfile) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();

    initiallyFollowing = Boolean(follow);
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
                <FollowButton
                  currentUserId={user.id}
                  profileUserId={profile.id}
                  initiallyFollowing={initiallyFollowing}
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
                <h1 className="text-4xl font-bold text-white">
                  @{profile.username}
                </h1>

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

                <GradientThemePicker
                  userId={profile.id}
                  currentTheme={profile.gradient_theme}
                />

                <EmbedCodeBox username={profile.username} />

                <ThemeToggle />
              </div>
            ) : null}
          </section>

          <div className="grid gap-4">
            {blips?.map((blip) => (
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
        </div>
      </main>
    </>
  );
}