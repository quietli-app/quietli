"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { darkGradientThemes, gradientThemes } from "@/lib/gradient-themes";

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
  const router = useRouter();
  const supabase = createClient();

  const cardBackground =
    gradientThemes[gradientTheme ?? "blush"] ?? gradientThemes.blush;
  const darkCardBackground =
    darkGradientThemes[gradientTheme ?? "blush"] ?? darkGradientThemes.blush;

  async function deleteBlip() {
    const confirmed = window.confirm("Delete this blip?");

    if (!confirmed) return;

    const { error } = await supabase.from("blips").delete().eq("id", id);

    if (error) {
      console.error("Error deleting blip:", error);
      return;
    }

    router.refresh();
  }

  return (
    <article
      className="theme-gradient-card overflow-hidden rounded-[2rem] border border-white/25 p-6 text-white shadow-[0_24px_60px_rgba(43,15,47,0.18)] backdrop-blur-xl"
      style={
        {
          "--theme-gradient-card-light": cardBackground,
          "--theme-gradient-card-dark": darkCardBackground,
        } as React.CSSProperties
      }
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/profile/${username}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border-4 border-white/90 bg-white/25 shadow-[0_8px_24px_rgba(43,15,47,0.16)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-normal text-white/90">
                {username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-normal text-white">
              @{username}
            </p>

            <p className="text-sm font-light text-white/72">
              {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </Link>

        {canDelete ? (
          <button
            type="button"
            onClick={deleteBlip}
            className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-normal text-white/75 transition hover:bg-white/25 hover:text-white"
          >
            Delete
          </button>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap text-xl font-normal leading-8 text-white/95">
        {content}
      </p>
    </article>
  );
}
