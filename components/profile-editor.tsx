"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileEditorProps = {
  userId: string;
  currentUsername: string;
  currentBio: string | null;
};

export function ProfileEditor({
  userId,
  currentUsername,
  currentBio,
}: ProfileEditorProps) {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const cleanedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanedUsername)) {
      setSaving(false);
      setError("Username must be 3-20 characters using letters, numbers, or underscores.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: cleanedUsername,
        bio: bio.trim(),
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setError("That username may already be taken.");
      return;
    }

    setMessage("Profile updated.");
    window.location.href = `/profile/${cleanedUsername}`;
  }

  return (
    <form
      onSubmit={saveProfile}
      className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl"
    >
      <p className="mb-2 text-xl font-bold text-white">Profile settings</p>
      <p className="mb-4 text-base text-slate-100">
        Update how you appear on Quietli.
      </p>

      <label className="mb-2 block text-sm font-bold text-white">
        Username
      </label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-4 w-full rounded-[1rem] border border-white/30 bg-white/60 px-4 py-3 text-[#642B73] outline-none"
      />

      <label className="mb-2 block text-sm font-bold text-white">
        Bio
      </label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={140}
        placeholder="A tiny note about you..."
        className="min-h-[90px] w-full resize-none rounded-[1rem] border border-white/30 bg-white/60 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#642B73]/60"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-100">{bio.length}/140</p>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-100">{error}</p> : null}
    </form>
  );
}