import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlipCard } from "@/components/blip-card";
import { gradientThemes, profileBackgroundThemes } from "@/lib/gradient-themes";

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { username } = await params;
  const { mode } = await searchParams;

  const embedMode = mode === "latest" ? "latest" : "feed";
  const limit = embedMode === "latest" ? 1 : 10;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, gradient_theme")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const activeTheme = profile.gradient_theme ?? "blush";
  const profileBackground =
    profileBackgroundThemes[activeTheme] ?? profileBackgroundThemes.blush;
  const blipBackground = gradientThemes[activeTheme] ?? gradientThemes.blush;

  const { data: blips } = await supabase
    .from("blips")
    .select("id, content, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const latestBlip = blips?.[0];
  const profileUrl = `/profile/${profile.username}`;

  if (embedMode === "latest") {
    return (
      <main
        className="embed-page"
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          background: "transparent",
        }}
      >
        {latestBlip ? (
          <article
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              overflow: "hidden",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "0 48px 0 18px",
              background: blipBackground,
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.35)",
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
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#642B73",
                  }}
                >
                  {profile.username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#2b0f2f",
                }}
              >
                @{profile.username}
              </p>

              <p
                style={{
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "1rem",
                  color: "#2b0f2f",
                }}
              >
                {latestBlip.content}
              </p>
            </div>

            <Link
  href={profileUrl}
  target="_blank"
  aria-label={`Open ${profile.username}'s Quietli profile`}
  style={{
    position: "absolute",
    right: "14px",
    bottom: "12px",
    width: "32px",
    height: "32px",
    borderRadius: "9999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
  }}
>
  <Image
    src="/quietli-q.png"
    alt="Quietli"
    width={24}
    height={24}
    style={{
      width: "24px",
      height: "24px",
      objectFit: "contain",
    }}
  />
</Link>
          </article>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              borderRadius: "24px",
              padding: "0 18px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
            }}
          >
            No blips yet.
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className="embed-page min-h-screen p-4"
      style={{ background: profileBackground }}
    >
      <section className="mb-4 rounded-[1.5rem] border border-white/20 bg-white/20 p-4 backdrop-blur-xl">
        <h1 className="text-xl font-bold text-white">@{profile.username}</h1>
        <p className="text-sm text-slate-100">
          {profile.bio || "A stream of passing thoughts."}
        </p>
      </section>

      <div className="grid gap-3">
        {blips?.map((blip) => (
          <BlipCard
            key={blip.id}
            id={blip.id}
            content={blip.content}
            createdAt={blip.created_at}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            gradientTheme={profile.gradient_theme}
            canDelete={false}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-white/70">Quietli</p>
    </main>
  );
}