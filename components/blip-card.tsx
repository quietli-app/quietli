"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gradientThemes } from "@/lib/gradient-themes";

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
      className="overflow-hidden rounded-[2rem] border border-white/20 p-5 text-white backdrop-blur-xl"
      style={{ background: cardBackground }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/profile/${username}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border-4 border-white/90 bg-white/25">
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
            <p className="truncate text-base font-normal text-white">
              @{username}
            </p>

            <p className="text-xs font-light text-white/65">
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

      <p className="whitespace-pre-wrap text-lg font-normal leading-8 text-white/92">
        {content}
      </p>
    </article>
  );
}