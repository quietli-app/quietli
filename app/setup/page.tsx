"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function SetupPage() {
  const supabase = useMemo(() => createClient(), []);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("You need to be signed in first.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUsername.length < 3) {
      setLoading(false);
      setError("Usernames need at least 3 characters.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError("That username is probably already taken.");
      return;
    }

    setMessage("Username updated.");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl items-center px-4">
      <div className="panel w-full max-w-xl rounded-[2rem] p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Choose your username</h1>
        <p className="mt-3 muted">Pick the name people will see on your blips.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_name"
            className="input-glass w-full rounded-[1.25rem] border border-white/25 px-4 py-3 outline-none placeholder:text-[#642B73]/70"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save username"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
      </div>
    </main>
  );
}
