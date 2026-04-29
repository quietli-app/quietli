import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradientThemes } from "@/lib/gradient-themes";

type EmbedVariant = "latest" | "feed";

type LatestEmbedHeight = 100 | 200 | 300;

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

function getLatestHeight(value?: string): LatestEmbedHeight {
  if (value === "200") return 200;
  if (value === "300") return 300;
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
  const latestHeight = getLatestHeight(height);

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, gradient_theme, profile_visibility")
    .eq("username", username)
    .single<Profile>();

  if (!profile) {
    notFound();
  }

  const cardBackground =
    gradientThemes[profile.gradient_theme ?? "blush"] ?? gradientThemes.blush;

  if (profile.profile_visibility === "private") {
    return (
      <>
        <EmbedPageResetStyles />

        <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] bg-white/20 px-4 text-center text-sm font-medium text-white">
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

    const isCompact = latestHeight === 100;

    return (
      <>
        <EmbedPageResetStyles />

        <main className="fixed inset-0 overflow-hidden bg-transparent font-sans">
          <div
            className={`relative flex h-full w-full overflow-hidden rounded-[24px] ${
              isCompact
                ? "items-center px-5"
                : "flex-col justify-center px-6 py-5"
            }`}
            style={{ background: cardBackground }}
          >
            <div
              className={`flex min-w-0 ${
                isCompact ? "items-center gap-4 pr-16" : "items-start gap-4 pr-16"
              }`}
            >
              <div
                className={`relative flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/30 ${
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
                  <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold text-[#2b0f2f]">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={`truncate font-semibold leading-5 text-[#2b0f2f] ${
                    isCompact ? "text-base" : "text-lg"
                  }`}
                >
                  @{profile.username}
                </p>

                {!isCompact ? (
                  <p className="mt-1 truncate text-sm font-medium text-[#2b0f2f]/70">
                    {profile.bio || "A stream of passing thoughts."}
                  </p>
                ) : null}

                <p
                  className={`text-[#2b0f2f] ${
                    isCompact
                      ? "mt-1 line-clamp-2 text-lg font-medium leading-6"
                      : "mt-5 line-clamp-3 text-2xl font-medium leading-9"
                  }`}
                >
                  {latestBlip?.content ?? "No blips yet."}
                </p>
              </div>
            </div>

            <img
              src="/logo-v3.png"
              alt="Quietli"
              className={`absolute object-contain opacity-90 ${
                isCompact
                  ? "bottom-3 right-4 h-10 w-10"
                  : "bottom-5 right-5 h-14 w-14"
              }`}
            />
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
          className="h-full w-full overflow-hidden rounded-[24px] p-4"
          style={{ background: cardBackground }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border-2 border-white/70 bg-white/30">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold text-[#2b0f2f]">
                  {profile.username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-[#2b0f2f]">
                @{profile.username}
              </p>

              <p className="truncate text-sm font-medium text-[#2b0f2f]/75">
                {profile.bio || "A stream of passing thoughts."}
              </p>
            </div>
          </div>

          <div className="grid max-h-[310px] gap-3 overflow-hidden">
            {blips && blips.length > 0 ? (
              blips.map((blip) => (
                <div
                  key={blip.id}
                  className="rounded-[1.25rem] border border-white/25 bg-white/25 p-4"
                >
                  <p className="line-clamp-3 text-base font-medium leading-7 text-[#2b0f2f]">
                    {blip.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-white/25 bg-white/25 p-4">
                <p className="text-base font-medium text-[#2b0f2f]">
                  No blips yet.
                </p>
              </div>
            )}
          </div>

          <img
            src="/logo-v3.png"
            alt="Quietli"
            className="absolute bottom-4 right-4 h-12 w-12 object-contain opacity-80"
          />
        </div>
      </main>
    </>
  );
}