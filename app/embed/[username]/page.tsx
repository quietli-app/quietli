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
            border-radius: clamp(18px, 3vw, 28px);
            box-shadow: 0 18px 35px rgba(0,0,0,0.12);

            grid-template-columns: clamp(34px, min(8vw, 38vh), 58px) minmax(0, 1fr);
            column-gap: clamp(10px, 1.8vw, 18px);
            align-items: center;

            padding:
              clamp(10px, 9vh, 20px)
              clamp(42px, 7vw, 64px)
              clamp(10px, 9vh, 20px)
              clamp(14px, 3vw, 28px);
          }

          .quietli-latest-avatar {
            position: relative;
            overflow: hidden;
            width: clamp(34px, min(8vw, 38vh), 58px);
            height: clamp(34px, min(8vw, 38vh), 58px);
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

          .quietli-latest-content {
            min-width: 0;
            min-height: 0;
            overflow: hidden;
          }

          .quietli-latest-username {
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: white;
            font-size: clamp(12px, min(2.5vw, 16vh), 19px);
            font-weight: 700;
            line-height: 1.05;
          }

          .quietli-latest-text {
            margin: clamp(2px, 1vh, 6px) 0 0 0;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            color: rgba(255,255,255,0.93);
            font-size: clamp(12px, min(2.35vw, 14vh), 18px);
            line-height: 1.18;
          }

          .quietli-latest-logo {
            position: absolute;
            right: clamp(14px, 2.8vw, 26px);
            bottom: clamp(12px, 2.6vh, 20px);
            width: clamp(20px, min(4.2vw, 16vh), 32px);
            height: clamp(20px, min(4.2vw, 16vh), 32px);
            object-fit: contain;
            opacity: 0.84;
          }

          @media (max-height: 105px) {
            .quietli-latest-card {
              padding-top: 10px;
              padding-bottom: 10px;
            }

            .quietli-latest-text {
              -webkit-line-clamp: 2;
              font-size: clamp(12px, min(2.15vw, 13vh), 16px);
              line-height: 1.12;
            }
          }

          @media (max-height: 84px) {
            .quietli-latest-text {
              -webkit-line-clamp: 1;
            }
          }

          @media (max-width: 420px) {
            .quietli-latest-card {
              grid-template-columns: 34px minmax(0, 1fr);
              column-gap: 10px;
              padding-left: 14px;
              padding-right: 42px;
            }

            .quietli-latest-avatar {
              width: 34px;
              height: 34px;
            }

            .quietli-latest-username {
              font-size: 13px;
            }

            .quietli-latest-text {
              font-size: 13px;
              line-height: 1.13;
            }

            .quietli-latest-logo {
              width: 20px;
              height: 20px;
              right: 14px;
              bottom: 12px;
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
              <div className="quietli-latest-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <div className="quietli-latest-avatar-fallback">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="quietli-latest-content">
                <p className="quietli-latest-username">@{profile.username}</p>

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