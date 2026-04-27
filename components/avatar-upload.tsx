"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AvatarUpload({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setMessage(null);
      setFileName(file.name);

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setMessage("Profile image updated.");
      window.location.reload();
    } catch (uploadErr) {
      console.error(uploadErr);
      setError("There was a problem uploading your profile image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="panel rounded-[1.5rem] p-5">
      <p className="mb-2 text-xl font-bold text-white">Profile image</p>
      <p className="mb-4 text-base muted">Upload a square image or portrait for your profile.</p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full bg-white/30 px-4 py-2 text-sm font-medium text-[#642B73] transition hover:bg-white/40">
          Choose image
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <span className="max-w-[260px] truncate text-sm text-white/90">
          {uploading ? "Uploading..." : fileName || "No file selected"}
        </span>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}
