import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";
type FeedEmbedHeight = 300 | 420 | 600;

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  gradient_theme: string | null;
  profile_visibility: string | null;
};

type Blip = {
  id: string;
  content: string;
  created_at: string;
};

function getFeedEmbedHeight(value?: string): FeedEmbedHeight {
  if (value === "300") return 300;
  if (value === "600") return 600;

  return 420;
}

function EmbedPageResetStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            overflow: hidden !important;
            background: transparent !important;
          }

          .nav-bar,
          footer {
            display: none !important;
          }

          * {
            box-sizing: border-box;
          }

          .quietli-embed-root {
            width: 100vw;
            height: 100vh;
            min-height: 0;
            overflow: hidden;
            background: transparent;
            font-family: inherit;
          }

          .quietli-latest-link {
            display: block;
            width: 100%;
            height: 100%;
            color: white;
            text-decoration: none;
          }

          .quietli-latest-card {
            position: relative;
            display: grid;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: clamp(16px, 4vw, 28px);
            box-shadow: 0 18px 35px rgba(0,0,0,0.12);

            /*
              This makes the layout respond to both iframe width and iframe height.
              Wider/taller embeds get more breathing room.
              Shorter embeds tighten up automatically.
            */
            padding:
              clamp(10px, 10vh, 22px)
              clamp(14px, 3.2vw, 30px);

            grid-template-rows: auto minmax(0, 1fr);
            row-gap: clamp(4px, 3vh, 12px);
          }

          .quietli-latest-top-row {
            display: grid;
            min-width: 0;
            align-items: center;
            grid-template-columns:
              clamp(26px, min(9vw, 36vh), 56px)
              minmax(0, 1fr);
            column-gap: clamp(8px, 2vw, 16px);
            padding-right: clamp(28px, 8vw, 58px);
          }

          .quietli-latest-avatar {
            position: relative;
            overflow: hidden;
            width: clamp(26px, min(9vw, 36vh), 56px);
            height: clamp(26px, min(9vw, 36vh), 56px);
            border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.7);
            background: rgba(255,255,255,0.25);
          }

          .quietli-latest-avatar img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border-radius: 999px;
            object-fit: cover;
          }

          .quietli-latest-avatar-fallback {
            display: flex;
            width: 100%;
            height: 100%;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            color: rgba(255,255,255,0.9);
            font-size: clamp(12px, min(4vw, 18vh), 20px);
            font-weight: 700;
          }

          .quietli-latest-username {
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: white;
            font-size: clamp(12px, min(3.1vw, 20vh), 24px);
            font-weight: 700;
            line-height: 1;
          }

          .quietli-latest-text-wrap {
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            padding-right: clamp(28px, 7vw, 52px);
          }

          .quietli-latest-text {
            margin: 0;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
            color: rgba(255,255,255,0.93);
            font-size: clamp(13px, min(2.8vw, 18vh), 24px);
            line-height: 1.18;
          }

          .quietli-latest-logo {
            position: absolute;
            right: clamp(14px, 2.8vw, 26px);
            bottom: clamp(12px, 2.6vh, 22px);
            width: clamp(20px, min(5vw, 22vh), 40px);
            height: clamp(20px, min(5vw, 22vh), 40px);
            object-fit: contain;
            opacity: 0.86;
          }

          /*
            Very short embeds need fewer text lines.
          */
          @media (max-height: 115px) {
            .quietli-latest-card {
              row-gap: 4px;
            }

            .quietli-latest-text {
              -webkit-line-clamp: 2;
              line-height: 1.14;
            }
          }

          @media (max-height: 90px) {
            .quietli-latest-text {
              -webkit-line-clamp: 1;
            }
          }

          /*
            Narrow embeds need a little more compression.
          */
          @media (max-width: 420px) {
            .quietli-latest-card {
              padding: 10px 14px;
            }

            .quietli-latest-top-row {
              padding-right: 34px;
            }

            .quietli-latest-text-wrap {
              padding-right: 34px;
            }
          }

          .quietli-embed-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.55) rgba(255,255,255,0.14);
          }

          .quietli-embed-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .quietli-embed-scroll::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.14);
            border-radius: 999px;
          }

          .quietli-embed-scroll::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.55);
            border-radius: 999px;
          }
        `,
      }}
    />
  );
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ variant?: string; height?: string }>;
}) {
  const { username } = await params;
  const { variant, height } = await searchParams;

  const embedVariant: EmbedVariant = variant === "feed" ? "feed" : "latest";
  const feedEmbedHeight = getFeedEmbedHeight(height);

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, gradient_theme, profile_visibility")
    .eq("username", username)
    .single<Profile>();

  if (!profile) {
    notFound();
  }

  const profileUrl = `https://quietli.io/profile/${profile.username}`;

  const cardBackground =
    gradientThemes[profile.gradient_theme ?? "blush"] ?? gradientThemes.blush;

  if (profile.profile_visibility === "private") {
    return (
      <>
        <EmbedPageResetStyles />

        <main className="quietli-embed-root">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/25 bg-white/20 px-4 text-center text-sm font-normal text-white/85">
            This Quietli profile is private.
          </div>
        </main>
      </>
    );
  }

  const blipLimit = embedVariant === "latest" ? 1 : 20;

  const { data: blips } = await supabase
    .from("blips")
    .select("id, content, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(blipLimit)
    .returns<Blip[]>();

  if (embedVariant === "latest") {
    const latestBlip = blips?.[0];

    return (
      <>
        <EmbedPageResetStyles />

        <main className="quietli-embed-root">
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="quietli-latest-link"
          >
            <article
              className="quietli-latest-card"
              style={{
                background: cardBackground,
              }}
            >
              <div className="quietli-latest-top-row">
                <div className="quietli-latest-avatar">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} />
                  ) : (
                    <div className="quietli-latest-avatar-fallback">
                      {profile.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <p className="quietli-latest-username">@{profile.username}</p>
              </div>

              <div className="quietli-latest-text-wrap">
                <p className="quietli-latest-text">
                  {latestBlip?.content ?? "No blips yet."}
                </p>
              </div>

              <img
                src="/quietli-q.png"
                alt="Quietli"
                className="quietli-latest-logo"
              />
            </article>
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <EmbedPageResetStyles />

      <main className="quietli-embed-root">
        <div
          className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/25"
          style={{
            background: cardBackground,
            height: feedEmbedHeight,
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="sticky top-0 z-10 border-b border-white/18 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex min-w-0 items-center gap-3 pr-12">
                <div className="relative h-12 w-12 flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/25 sm:h-14 sm:w-14">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-medium text-white/90">
                      {profile.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-medium text-white sm:text-xl">
                    @{profile.username}
                  </p>

                  <p className="truncate text-sm font-normal text-white/72">
                    {profile.bio || "A stream of passing thoughts."}
                  </p>
                </div>
              </div>
            </div>

            <div className="quietli-embed-scroll h-full overflow-y-auto px-4 pb-20 pt-4">
              <div className="grid gap-3">
                {blips && blips.length > 0 ? (
                  blips.map((blip) => (
                    <div
                      key={blip.id}
                      className="rounded-[1.25rem] border border-white/25 bg-white/18 p-4 backdrop-blur-md"
                    >
                      <p className="text-base font-normal leading-7 text-white/92">
                        {blip.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-white/25 bg-white/18 p-4 backdrop-blur-md">
                    <p className="text-base font-normal text-white/92">
                      No blips yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="absolute bottom-4 right-4 z-20 h-12 w-12 object-contain opacity-85 transition hover:opacity-100"
          >
            <img
              src="/quietli-q.png"
              alt="Quietli"
              className="h-full w-full object-contain"
            />
          </a>
        </div>
      </main>
    </>
  );
}