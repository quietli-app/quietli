import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";
type EmbedHeight = 100 | 200 | 300 | 420 | 600;

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
  if (value === "200") return 200;
  if (value === "300") return 300;
  if (value === "420") return 420;
  if (value === "600") return 600;
  return 100;
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

  const blipLimit = embedVariant === "latest" ? 1 : 5;

  const { data: blips } = await supabase
    .from("blips")
    .select("id, content, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(blipLimit)
    .returns<Blip[]>();

  if (embedVariant === "latest") {
    const latestBlip = blips?.[0];

    const isCompact = embedHeight === 100;
    const isMedium = embedHeight === 200 || embedHeight === 300;

    return (
      <>
        <EmbedPageResetStyles />

        <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
          <div
            className={`relative flex h-full w-full overflow-hidden rounded-[24px] border border-white/25 ${
              isCompact
                ? "items-center px-5"
                : "flex-col justify-center px-6 py-5"
            }`}
            style={{ background: cardBackground }}
          >
            <div
              className={`flex min-w-0 ${
                isCompact
                  ? "items-center gap-4 pr-16"
                  : "items-start gap-4 pr-20"
              }`}
            >
              <div
                className={`relative flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/25 ${
                  isCompact ? "h-14 w-14" : "h-16 w-16"
                }`}
              >
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
                <p
                  className={`truncate font-medium leading-5 text-white ${
                    isCompact ? "text-base" : "text-lg"
                  }`}
                >
                  @{profile.username}
                </p>

                {!isCompact ? (
                  <p className="mt-1 truncate text-sm font-normal text-white/72">
                    {profile.bio || "A stream of passing thoughts."}
                  </p>
                ) : null}

                <p
                  className={`text-white/92 ${
                    isCompact
                      ? "mt-1 line-clamp-2 text-lg font-normal leading-6"
                      : isMedium
                        ? "mt-5 line-clamp-4 text-2xl font-normal leading-9"
                        : "mt-8 line-clamp-6 text-3xl font-normal leading-[3rem]"
                  }`}
                >
                  {latestBlip?.content ?? "No blips yet."}
                </p>
              </div>
            </div>

            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open @${profile.username} on Quietli`}
              className={`absolute object-contain opacity-90 transition hover:opacity-100 ${
                isCompact
                  ? "bottom-3 right-4 h-10 w-10"
                  : "bottom-5 right-5 h-14 w-14"
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
          className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/25 p-4"
          style={{ background: cardBackground }}
        >
          <div className="mb-4 flex items-center gap-3 pr-16">
            <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/25">
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
              <p className="truncate text-xl font-medium text-white">
                @{profile.username}
              </p>

              <p className="truncate text-sm font-normal text-white/72">
                {profile.bio || "A stream of passing thoughts."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 overflow-hidden">
            {blips && blips.length > 0 ? (
              blips.map((blip) => (
                <div
                  key={blip.id}
                  className="rounded-[1.25rem] border border-white/25 bg-white/18 p-4 backdrop-blur-md"
                >
                  <p className="line-clamp-3 text-base font-normal leading-7 text-white/92">
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

          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open @${profile.username} on Quietli`}
            className="absolute bottom-4 right-4 h-12 w-12 object-contain opacity-85 transition hover:opacity-100"
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