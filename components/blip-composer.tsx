"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MAX_LENGTH = 240;

export function BlipComposer({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function submitBlip(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    const value = content.trim();
    if (!value || loading) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.from("blips").insert({
      user_id: userId,
      content: value,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setContent("");
    router.refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitBlip();
    }
  }

  return (
    <form
      onSubmit={submitBlip}
      className="mb-8 rounded-[2rem] border border-white/20 bg-white/30 p-5 backdrop-blur-xl"
    >
      <label
        htmlFor="blip"
        className="mb-3 block text-sm font-bold text-black"
      >
        What floated through your brain?
      </label>

      <textarea
        id="blip"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_LENGTH}
        placeholder="A passing thought, a soft observation, a tiny idea..."
        className="min-h-[120px] w-full resize-none rounded-[1.5rem] border border-white/30 bg-white/60 px-4 py-3 text-[#642B73] outline-none ring-0 placeholder:text-[#642B73]/60"
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-100">{content.length}/{MAX_LENGTH}</p>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Blipping..." : "Post blip"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
    </form>
  );
}