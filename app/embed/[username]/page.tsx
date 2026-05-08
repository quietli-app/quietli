import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";
type EmbedHeight = 160 | 220 | 300 | 420 | 600;

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

function getEmbedHeight(value?: string): EmbedHeight {
  if (value === "220") return 220;
  if (value === "300") return 300;
  if (value === "420") return 420;
  if (value === "600") return 600;
  return 160;
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
  const embedHeight = getEmbedHeight(height);

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

        <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
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
    const isTallLatest = embedHeight >= 220;

    return (
      <>
        <EmbedPageResetStyles />

        <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
          <div
            className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[24px] border border-white/25 px-4 py-4"
            style={{ background: cardBackground }}
          >
            <div className="flex min-w-0 items-center gap-3 pr-10">
              <div
                className={`relative flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/25 ${
                  isTallLatest ? "h-14 w-14" : "h-12 w-12"
                }`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full text-base font-medium text-white/90">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold leading-5 text-white ${
                    isTallLatest ? "text-lg" : "text-base"
                  }`}
                >
                  @{profile.username}
                </p>

                {isTallLatest ? (
                  <p className="mt-1 truncate text-sm font-normal text-white/72">
                    {profile.bio || "A stream of passing thoughts."}
                  </p>
                ) : null}
              </div>
            </div>

            <div className={`${isTallLatest ? "mt-4" : "mt-3"} min-w-0`}>
              <p
                className={`text-white/94 ${
                  isTallLatest
                    ? "line-clamp-4 text-xl font-normal leading-8"
                    : "line-clamp-3 text-base font-normal leading-6"
                }`}
              >
                {latestBlip?.content ?? "No blips yet."}
              </p>
            </div>

            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open @${profile.username} on Quietli`}
              className={`absolute object-contain opacity-85 transition hover:opacity-100 ${
                isTallLatest
                  ? "right-4 top-4 h-10 w-10"
                  : "right-4 top-4 h-8 w-8"
              }`}
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

  return (
    <>
      <EmbedPageResetStyles />

      <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
        <div
          className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/25"
          style={{ background: cardBackground }}
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