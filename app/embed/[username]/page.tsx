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

          .quietli-latest-card {
            height: 100px;
            min-height: 100px;
            max-height: 100px;
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
              width: 28px !important;
              height: 28px !important;
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
              width: 24px !important;
              height: 24px !important;
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

        <main className="fixed inset-0 overflow-hidden bg-transparent p-0 font-sans">
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

        <main className="fixed inset-0 overflow-hidden bg-transparent p-0 font-sans">
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="block h-[100px] w-full text-white no-underline"
          >
            <article
              className="quietli-latest-card grid w-full overflow-hidden rounded-[24px] border border-white/25 px-4 py-3 shadow-lg shadow-black/10"
              style={{
                background: cardBackground,
                gridTemplateRows: "30px minmax(0, 1fr)",
                rowGap: "4px",
              }}
            >
              <div className="grid min-w-0 items-center grid-cols-[34px_minmax(0,1fr)_32px] gap-3">
                <div
                  className="quietli-latest-avatar relative overflow-hidden rounded-full border-2 border-white/70 bg-white/25"
                  style={{
                    width: 34,
                    height: 34,
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
                    fontSize: 14,
                  }}
                >
                  @{profile.username}
                </p>

                <img
                  src="/quietli-q.png"
                  alt="Quietli"
                  className="quietli-latest-logo object-contain opacity-90"
                  style={{
                    width: 32,
                    height: 32,
                  }}
                />
              </div>

              <p
                className="quietli-latest-text quietli-clamp-2 m-0 min-w-0 text-white/92"
                style={{
                  fontSize: 15,
                  lineHeight: 1.16,
                }}
              >
                {latestBlip?.content ?? "No blips yet."}
              </p>
            </article>
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <EmbedPageResetStyles />

      <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
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