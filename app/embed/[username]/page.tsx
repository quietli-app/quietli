import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";
type EmbedSize = "compact" | "standard" | "large";
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

function getEmbedSize(value?: string): EmbedSize {
  if (value === "compact") return "compact";
  if (value === "large") return "large";

  return "standard";
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
            width: 100%;
            min-height: 0;
            overflow: hidden;
            background: transparent;
            font-family: inherit;
          }

          .quietli-latest-link {
            display: block;
            width: 100%;
            color: white;
            text-decoration: none;
          }

          .quietli-latest-card {
            position: relative;
            display: grid;
            width: 100%;
            min-height: 100px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 24px;
            box-shadow: 0 18px 35px rgba(0,0,0,0.12);
            grid-template-columns: 42px minmax(0, 1fr);
            column-gap: 14px;
            align-items: start;
            padding: 14px 48px 16px 16px;
          }

          .quietli-latest-card[data-size="compact"] {
            min-height: 100px;
            grid-template-columns: 36px minmax(0, 1fr);
            column-gap: 12px;
            padding: 12px 44px 14px 14px;
          }

          .quietli-latest-card[data-size="large"] {
            min-height: 160px;
            grid-template-columns: 56px minmax(0, 1fr);
            column-gap: 18px;
            padding: 20px 64px 24px 22px;
          }

          .quietli-latest-avatar {
            position: relative;
            overflow: hidden;
            width: 42px;
            height: 42px;
            border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.7);
            background: rgba(255,255,255,0.25);
          }

          .quietli-latest-card[data-size="compact"] .quietli-latest-avatar {
            width: 36px;
            height: 36px;
          }

          .quietli-latest-card[data-size="large"] .quietli-latest-avatar {
            width: 56px;
            height: 56px;
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
            font-size: 16px;
            font-weight: 700;
          }

          .quietli-latest-content {
            min-width: 0;
            overflow: hidden;
          }

          .quietli-latest-username {
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: white;
            font-size: 16px;
            font-weight: 700;
            line-height: 1.05;
          }

          .quietli-latest-card[data-size="compact"] .quietli-latest-username {
            font-size: 14px;
          }

          .quietli-latest-card[data-size="large"] .quietli-latest-username {
            font-size: 20px;
          }

          .quietli-latest-text {
            margin: 6px 0 0 0;
            color: rgba(255,255,255,0.93);
            font-size: 15px;
            line-height: 1.25;
            overflow-wrap: anywhere;
          }

          .quietli-latest-card[data-size="compact"] .quietli-latest-text {
            margin-top: 5px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-size: 14px;
            line-height: 1.18;
          }

          .quietli-latest-card[data-size="large"] .quietli-latest-text {
            margin-top: 10px;
            font-size: 20px;
            line-height: 1.35;
          }

          .quietli-latest-logo {
            position: absolute;
            right: 18px;
            bottom: 16px;
            width: 24px;
            height: 24px;
            object-fit: contain;
            opacity: 0.84;
          }

          .quietli-latest-card[data-size="compact"] .quietli-latest-logo {
            right: 16px;
            bottom: 14px;
            width: 21px;
            height: 21px;
          }

          .quietli-latest-card[data-size="large"] .quietli-latest-logo {
            right: 24px;
            bottom: 22px;
            width: 34px;
            height: 34px;
          }

          @media (max-width: 420px) {
            .quietli-latest-card,
            .quietli-latest-card[data-size="standard"],
            .quietli-latest-card[data-size="large"] {
              grid-template-columns: 36px minmax(0, 1fr);
              column-gap: 12px;
              padding: 12px 44px 15px 14px;
            }

            .quietli-latest-avatar,
            .quietli-latest-card[data-size="standard"] .quietli-latest-avatar,
            .quietli-latest-card[data-size="large"] .quietli-latest-avatar {
              width: 36px;
              height: 36px;
            }

            .quietli-latest-username,
            .quietli-latest-card[data-size="standard"] .quietli-latest-username,
            .quietli-latest-card[data-size="large"] .quietli-latest-username {
              font-size: 14px;
            }

            .quietli-latest-text,
            .quietli-latest-card[data-size="standard"] .quietli-latest-text,
            .quietli-latest-card[data-size="large"] .quietli-latest-text {
              font-size: 14px;
              line-height: 1.2;
            }

            .quietli-latest-logo,
            .quietli-latest-card[data-size="standard"] .quietli-latest-logo,
            .quietli-latest-card[data-size="large"] .quietli-latest-logo {
              width: 21px;
              height: 21px;
              right: 16px;
              bottom: 14px;
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

function EmbedResizeScript({
  embedId,
}: {
  embedId: string | undefined;
}) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            var embedId = ${JSON.stringify(embedId ?? "")};

            function getHeight() {
              var root = document.querySelector("[data-quietli-resize-root]");
              if (!root) return 0;

              var rect = root.getBoundingClientRect();
              return Math.ceil(rect.height);
            }

            function postHeight() {
              if (!window.parent || !embedId) return;

              var height = getHeight();
              if (!height) return;

              window.parent.postMessage(
                {
                  type: "QUIETLI_EMBED_RESIZE",
                  id: embedId,
                  height: height
                },
                "*"
              );
            }

            window.addEventListener("load", postHeight);
            window.addEventListener("resize", postHeight);

            if (typeof ResizeObserver !== "undefined") {
              var root = document.querySelector("[data-quietli-resize-root]");
              if (root) {
                var observer = new ResizeObserver(postHeight);
                observer.observe(root);
              }
            }

            setTimeout(postHeight, 50);
            setTimeout(postHeight, 250);
            setTimeout(postHeight, 1000);
          })();
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
  searchParams: Promise<{
    variant?: string;
    height?: string;
    size?: string;
    quietliEmbedId?: string;
  }>;
}) {
  const { username } = await params;
  const { variant, height, size, quietliEmbedId } = await searchParams;

  const embedVariant: EmbedVariant = variant === "feed" ? "feed" : "latest";
  const embedSize = getEmbedSize(size);
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

        <main className="quietli-embed-root" data-quietli-resize-root>
          <div className="flex w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/25 bg-white/20 px-4 py-6 text-center text-sm font-normal text-white/85">
            This Quietli profile is private.
          </div>
        </main>

        <EmbedResizeScript embedId={quietliEmbedId} />
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

        <main className="quietli-embed-root" data-quietli-resize-root>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="quietli-latest-link"
          >
            <article
              className="quietli-latest-card"
              data-size={embedSize}
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

        <EmbedResizeScript embedId={quietliEmbedId} />
      </>
    );
  }

  return (
    <>
      <EmbedPageResetStyles />

      <main
        className="quietli-embed-root"
        data-quietli-resize-root
        style={{
          height: feedEmbedHeight,
        }}
      >
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

      <EmbedResizeScript embedId={quietliEmbedId} />
    </>
  );
}