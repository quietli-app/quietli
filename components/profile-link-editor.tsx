"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileLinkEditorProps = {
  userId: string;
  currentLabel?: string | null;
  currentUrl?: string | null;
};

export function ProfileLinkEditor({
  userId,
  currentLabel,
  currentUrl,
}: ProfileLinkEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [label, setLabel] = useState(currentLabel ?? "");
  const [url, setUrl] = useState(currentUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function normalizeUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) return "";

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  function isValidUrl(value: string) {
    if (!value) return true;

    try {
      const parsedUrl = new URL(value);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function saveProfileLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const finalLabel = label.trim();
    const finalUrl = normalizeUrl(url);

    if (finalUrl && !finalLabel) {
      setErrorMessage("Please add a label for your link.");
      return;
    }

    if (finalLabel && !finalUrl) {
      setErrorMessage("Please add a URL for your link.");
      return;
    }

    if (!isValidUrl(finalUrl)) {
      setErrorMessage("Please enter a valid link.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_link_label: finalLabel || null,
        profile_link_url: finalUrl || null,
      })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      console.error("Error saving profile link:", error);
      setErrorMessage("Something went wrong while saving your profile link.");
      return;
    }

    setUrl(finalUrl);
    setMessage(finalUrl ? "Profile link saved." : "Profile link removed.");
    router.refresh();
  }

  async function removeProfileLink() {
    setMessage("");
    setErrorMessage("");
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_link_label: null,
        profile_link_url: null,
      })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      console.error("Error removing profile link:", error);
      setErrorMessage("Something went wrong while removing your profile link.");
      return;
    }

    setLabel("");
    setUrl("");
    setMessage("Profile link removed.");
    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Profile link</p>

      <p className="mb-4 text-base leading-7 text-slate-100">
        Add one link to your Quietli profile. This can be your website,
        portfolio, podcast, music, newsletter, or another quiet corner.
      </p>

      <form onSubmit={saveProfileLink} className="grid gap-4">
        <div>
          <label
            htmlFor="profile-link-label"
            className="mb-2 block text-sm font-bold text-white"
          >
            Link label
          </label>

          <input
            id="profile-link-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={40}
            placeholder="My website"
            className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
          />

          <p className="mt-2 text-xs text-white/60">{label.length}/40</p>
        </div>

        <div>
          <label
            htmlFor="profile-link-url"
            className="mb-2 block text-sm font-bold text-white"
          >
            URL
          </label>

          <input
            id="profile-link-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save link"}
          </button>

          {currentUrl || url ? (
            <button
              type="button"
              onClick={removeProfileLink}
              disabled={isSaving}
              className="rounded-full border border-white/30 bg-white/20 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove link
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="mt-4 text-sm text-white/85">{message}</p> : null}

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm leading-6 text-red-50">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}