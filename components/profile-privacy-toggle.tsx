"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfilePrivacyToggleProps = {
  userId: string;
  currentVisibility?: string | null;
};

export function ProfilePrivacyToggle({
  userId,
  currentVisibility,
}: ProfilePrivacyToggleProps) {
  const router = useRouter();
  const supabase = createClient();

  const [visibility, setVisibility] = useState(
    currentVisibility === "private" ? "private" : "public"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateVisibility(nextVisibility: "public" | "private") {
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ profile_visibility: nextVisibility })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      console.error("Error updating profile visibility:", error);
      setMessage("Something went wrong while updating your profile privacy.");
      return;
    }

    setVisibility(nextVisibility);
    setMessage(
      nextVisibility === "private"
        ? "Your blips are now private."
        : "Your blips are now public."
    );

    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Profile privacy</p>

      <p className="mb-4 text-base leading-7 text-slate-100">
        Choose whether your blips are visible to everyone or only to people who
        follow you.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateVisibility("public")}
          disabled={isSaving}
          className={`rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            visibility === "public"
              ? "bg-white text-[#642B73]"
              : "bg-white/25 text-white hover:bg-white/35"
          }`}
        >
          Public
        </button>

        <button
          type="button"
          onClick={() => updateVisibility("private")}
          disabled={isSaving}
          className={`rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            visibility === "private"
              ? "bg-white text-[#642B73]"
              : "bg-white/25 text-white hover:bg-white/35"
          }`}
        >
          Private
        </button>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/70">
        Public profiles appear in World View. Private profiles only show blips
        to you and people who follow you.
      </p>

      {message ? <p className="mt-3 text-sm text-white/85">{message}</p> : null}
    </div>
  );
}