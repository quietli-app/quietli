import Link from "next/link";
import { darkGradientThemes, gradientThemes } from "@/lib/gradient-themes";
import { DeleteBlipButton } from "@/components/delete-blip-button";

type BlipCardProps = {
  id: string;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  gradientTheme?: string | null;
  canDelete?: boolean;
};

export function BlipCard({
  id,
  content,
  createdAt,
  username,
  avatarUrl,
  gradientTheme,
  canDelete = false,
}: BlipCardProps) {
  const date = new Date(createdAt).toLocaleString();
  const selectedTheme = gradientTheme || "blush";

  const lightBackground =
    gradientThemes[selectedTheme] ?? gradientThemes.blush;

  const darkBackground =
    darkGradientThemes[selectedTheme] ?? darkGradientThemes.blush;

  return (
    <article
      className="blip-card group relative overflow-hidden rounded-[1.75rem] border border-white/20 p-5 backdrop-blur-xl"
      style={
        {
          "--blip-bg": lightBackground,
          "--blip-dark-bg": darkBackground,
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-white/20" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/50 blur-sm" />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#642B73]">
                {username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <Link
              href={`/profile/${username}`}
              className="font-medium text-[#2b0f2f] transition-colors hover:underline dark:text-white"
            >
              @{username}
            </Link>
            <p className="text-xs text-[#2b0f2f]/70 transition-colors dark:text-white/70">
              {date}
            </p>
          </div>
        </div>

        {canDelete ? <DeleteBlipButton blipId={id} /> : null}
      </div>

      <p className="relative whitespace-pre-wrap text-[15px] leading-7 text-[#2b0f2f] transition-colors dark:text-white">
        {content}
      </p>
    </article>
  );
}