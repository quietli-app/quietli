import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";
type LatestEmbedSize = "compact" | "standard" | "large";
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

const latestSizeSettings: Record<
  LatestEmbedSize,
  {
    height: number;
    avatarSize: number;
    logoSize: number;
    usernameFontSize: number;
    textFontSize: number;
    lineHeight: number;
    lineClamp: number;
    padding: string;
  }
> = {
  compact: {
    height: 100,
    avatarSize: 34,
    logoSize: 24,
    usernameFontSize: 14,
    textFontSize: 15,
    lineHeight: 1.16,
    lineClamp: 2,
    padding: "12px 16px",
  },
  standard: {
    height: 152,
    avatarSize: 42,
    logoSize: 28,
    usernameFontSize: 16,
    textFontSize: 17,
    lineHeight: 1.3,
    lineClamp: 4,
    padding: "16px 18px",
  },
  large: {
    height: 220,
    avatarSize: 50,
    logoSize: 34,
    usernameFontSize: 18,
    textFontSize: 20,
    lineHeight: 1.35,
    lineClamp: 6,
    padding: "20px",
  },
};

function getLatestEmbedSize(value?: string): LatestEmbedSize {
  if (value === "standard" || value === "large") return value;

  return "compact";
}

function getFeedEmbedHeight(value?: string): FeedEmbedHeight {
  if (value === "300") return 300;
  if (value === "600") return 600;

  return 420;
}

function EmbedPageResetStyles({ responsive }: { responsive: boolean }) {
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
            overflow: ${responsive ? "visible" : "hidden"} !important;
            background: transparent !important;
          }

          html,
          body {
            height: ${responsive ? "auto" : "100%"} !important;
          }

          .nav-bar,
          footer {
            display: none !important;
          }

          * {
            box-sizing: border-box;
          }

          .quietli-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .quietli-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .quietli-clamp-dynamic {
            display: -webkit-box;
            -webkit-line-clamp: var(--quietli-line-clamp, 2);
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .quietli-latest-card {
            height: var(--quietli-latest-height, 100px);
            min-height: var(--quietli-latest-height, 100px);
            max-height: var(--quietli-latest-height, 100px);
          }

          @media (max-width: 520px) {
            .quietli-latest-card {
              border-radius: 22px;
              padding: 10px 14px 10px 14px !important;
            }

            .quietli-latest-avatar {
              width: 30px !important;
              height: 30px !important;
            }

            .quietli-latest-username {
              font-size: 13px !important;
            }

            .quietli-latest-text {
              font-size: 14px !important;
              line-height: 1.16 !important;
            }

            .quietli-latest-logo {
              width: 22px !important;
              height: 22px !important;
              right: 16px !important;
              bottom: 14px !important;
            }
          }

          @media (max-width: 360px) {
            .quietli-latest-card {
              padding: 9px 12px 9px 12px !important;
            }

            .quietli-latest-avatar {
              width: 26px !important;
              height: 26px !important;
            }

            .quietli-latest-username {
              font-size: 12px !important;
            }

            .quietli-latest-text {
              font-size: 13px !important;
              line-height: 1.14 !important;
            }

            .quietli-latest-logo {
              width: 20px !important;
              height: 20px !important;
              right: 14px !important;
              bottom: 13px !important;
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

function EmbedResizeScript({ embedId }: { embedId: string }) {
  if (!embedId) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const embedId = ${JSON.stringify(embedId)};
            const root = document.querySelector("[data-quietli-embed-root]");

            if (!root || !window.parent) return;

            let lastHeight = 0;

            function getHeight() {
              const rect = root.getBoundingClientRect();

              return Math.ceil(Math.max(
                rect.height,
                root.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.scrollHeight
              ));
            }

            function postHeight() {
              const height = getHeight();

              if (!height || Math.abs(height - lastHeight) < 1) return;

              lastHeight = height;

              window.parent.postMessage({
                type: "quietli:embed:resize",
                embedId,
                height
              }, "*");
            }

            if ("ResizeObserver" in window) {
              new ResizeObserver(postHeight).observe(root);
            }

            window.addEventListener("load", postHeight);
            window.addEventListener("resize", postHeight);
            requestAnimationFrame(postHeight);
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
    layout?: string;
    embedId?: string;
  }>;
}) {
  const { username } = await params;
  const { variant, height, size, layout, embedId = "" } = await searchParams;

  const embedVariant: EmbedVariant = variant === "feed" ? "feed" : "latest";
  const latestEmbedSize = getLatestEmbedSize(size);
  const latestSettings = latestSizeSettings[latestEmbedSize];
  const feedEmbedHeight = getFeedEmbedHeight(height);
  const isResponsive = layout === "responsive";

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
        <EmbedPageResetStyles responsive={isResponsive} />

        <main
          data-quietli-embed-root
          className={`${
            isResponsive ? "relative" : "fixed inset-0"
          } overflow-hidden bg-transparent p-0 font-sans`}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/25 bg-white/20 px-4 text-center text-sm font-normal text-white/85">
            This Quietli profile is private.
          </div>
        </main>

        <EmbedResizeScript embedId={embedId} />
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
        <EmbedPageResetStyles responsive={isResponsive} />

        <main
          data-quietli-embed-root
          className={`${
            isResponsive ? "relative" : "fixed inset-0"
          } overflow-hidden bg-transparent p-0 font-sans`}
        >
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="block w-full text-white no-underline"
            style={{
              height: latestSettings.height,
            }}
          >
            <article
              className="quietli-latest-card relative grid w-full overflow-hidden rounded-[24px] border border-white/25 px-4 py-3 shadow-lg shadow-black/10"
              style={
                {
                  "--quietli-latest-height": `${latestSettings.height}px`,
                  "--quietli-line-clamp": latestSettings.lineClamp,
                  padding: latestSettings.padding,
                background: cardBackground,
                  gridTemplateRows: `${latestSettings.avatarSize}px minmax(0, 1fr)`,
                  rowGap: latestEmbedSize === "compact" ? "4px" : "10px",
                } as React.CSSProperties
              }
            >
              <div
                className="grid min-w-0 items-center gap-3 pr-10"
                style={{
                  gridTemplateColumns: `${latestSettings.avatarSize}px minmax(0, 1fr)`,
                }}
              >
                <div
                  className="quietli-latest-avatar relative overflow-hidden rounded-full border-2 border-white/70 bg-white/25"
                  style={{
                    width: latestSettings.avatarSize,
                    height: latestSettings.avatarSize,
                  }}
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold text-white/90">
                      {profile.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <p
                  className="quietli-latest-username m-0 truncate font-semibold leading-none text-white"
                  style={{
                    fontSize: latestSettings.usernameFontSize,
                  }}
                >
                  @{profile.username}
                </p>
              </div>

              <p
                className="quietli-latest-text quietli-clamp-dynamic m-0 min-w-0 pr-10 text-white/92"
                style={{
                  fontSize: latestSettings.textFontSize,
                  lineHeight: latestSettings.lineHeight,
                }}
              >
                {latestBlip?.content ?? "No blips yet."}
              </p>

              <img
                src="/quietli-q.png"
                alt="Quietli"
                className="quietli-latest-logo absolute bottom-4 right-5 object-contain opacity-85"
                style={{
                  width: latestSettings.logoSize,
                  height: latestSettings.logoSize,
                }}
              />
            </article>
          </a>
        </main>

        <EmbedResizeScript embedId={embedId} />
      </>
    );
  }

  const feedHeader = (
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
  );

  const feedBlips = (
    <div
      className={`${
        isResponsive ? "" : "quietli-embed-scroll h-full overflow-y-auto"
      } px-4 pb-20 pt-4`}
    >
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
  );

  return (
    <>
      <EmbedPageResetStyles responsive={isResponsive} />

      <main
        data-quietli-embed-root
        className={`${
          isResponsive ? "relative" : "fixed inset-0 overflow-hidden"
        } bg-transparent font-sans`}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/25"
          style={{
            background: cardBackground,
            height: isResponsive ? "auto" : feedEmbedHeight,
          }}
        >
          <div
            className={isResponsive ? "relative" : "absolute inset-0 overflow-hidden"}
          >
            {feedHeader}
            {feedBlips}
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

      <EmbedResizeScript embedId={embedId} />
    </>
  );
}
