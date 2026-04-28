"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Account created. Check your email if confirmation is required, then log in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl items-center px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-white/20 p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {mode === "login" ? "Log in to Quietli" : "Create your Quietli account"}
        </h1>

        <p className="mt-2 text-slate-100">
          {mode === "login"
            ? "Use your email and password to return to your blips."
            : "Create an account so your blips belong to your profile."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[1.25rem] border border-white/30 bg-white/60 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#642B73]/60"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-[1.25rem] border border-white/30 bg-white/60 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#642B73]/60"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMessage(null);
            setMode(mode === "login" ? "signup" : "login");
          }}
          className="mt-5 text-sm font-medium text-white underline underline-offset-4"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Log in"}
        </button>

        {message ? <p className="mt-4 text-sm text-emerald-100">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-100">{error}</p> : null}
      </div>
    </main>
  );
}