"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GradientThemePickerProps = {
  userId: string;
  currentTheme?: string | null;
};

const themeOptions = [
  {
    id: "blush",
    label: "Quietli",
    preview:
      "linear-gradient(135deg, #a69ee8 0%, #9589dc 32%, #8676cf 62%, #a590a3 86%, #b8a1a9 100%)",
  },
  {
    id: "plum",
    label: "Plum",
    preview:
      "linear-gradient(135deg, rgba(244,114,182,0.95), rgba(145,35,104,0.95), rgba(91,31,95,0.95))",
  },
  {
    id: "sunset",
    label: "Sunset",
    preview:
      "linear-gradient(135deg, rgba(253,186,116,0.95), rgba(249,168,212,0.95), rgba(192,132,252,0.95))",
  },
  {
    id: "lavender",
    label: "Lavender",
    preview:
      "linear-gradient(135deg, rgba(216,180,254,0.95), rgba(240,171,252,0.95), rgba(251,207,232,0.95))",
  },
  {
    id: "ocean",
    label: "Ocean",
    preview:
      "linear-gradient(135deg, rgba(103,232,249,0.95), rgba(147,197,253,0.95), rgba(165,180,252,0.95))",
  },
  {
    id: "mint",
    label: "Mint",
    preview:
      "linear-gradient(135deg, rgba(167,243,208,0.95), rgba(153,246,228,0.95), rgba(165,243,252,0.95))",
  },
];

export function GradientThemePicker({
  userId,
  currentTheme,
}: GradientThemePickerProps) {
  const router = useRouter();
  const supabase = createClient();

  async function updateTheme(themeId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ gradient_theme: themeId })
      .eq("id", userId);

    if (error) {
      console.error("Error updating gradient theme:", error);
      return;
    }

    router.refresh();
  }

  const activeTheme = currentTheme ?? "blush";

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Blip style</p>
      <p className="mb-4 text-base text-slate-100">
        Choose the gradient style that appears behind your blips.
      </p>

      <div className="flex flex-wrap gap-3">
        {themeOptions.map((theme) => {
          const isActive = activeTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              aria-label={`Choose ${theme.label} theme`}
              onClick={() => updateTheme(theme.id)}
              className={`h-12 w-12 rounded-full border-2 transition ${
                isActive
                  ? "border-white ring-2 ring-white/70"
                  : "border-white/30 hover:border-white/70"
              }`}
              style={{
                background: theme.preview,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}