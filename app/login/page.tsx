"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function cleanUsername(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const finalUsername = cleanUsername(username);

    if (!finalUsername || finalUsername.length < 3) {
      setErrorMessage("Please choose a username with at least 3 characters.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Please choose a password with at least 6 characters.");
      setIsSubmitting(false);
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", finalUsername)
      .maybeSingle();

    if (existingProfile) {
      setErrorMessage("That username is already taken.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: finalUsername,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Almost there. Check your email for a Quietli confirmation link, then come back and sign in."
    );
  }

  const isSignUp = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-medium text-white/75">
            ← Back to Quietli
          </Link>

          <h1 className="mt-5 text-4xl font-bold">
            {isSignUp ? "Join Quietli" : "Welcome back"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/75">
            {isSignUp
              ? "Create your account, choose your username, and start posting quiet little blips."
              : "Sign in to post blips, edit your profile, and manage your embed."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-white/15 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMessage("");
              setErrorMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              !isSignUp
                ? "bg-white text-[#642B73]"
                : "text-white hover:bg-white/10"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
              setErrorMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              isSignUp
                ? "bg-white text-[#642B73]"
                : "text-white hover:bg-white/10"
            }`}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={isSignUp ? handleSignUp : handleSignIn}
          className="grid gap-4"
        >
          {isSignUp ? (
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-bold text-white"
              >
                Username
              </label>

              <input
                id="username"
                value={username}
                onChange={(event) =>
                  setUsername(cleanUsername(event.target.value))
                }
                placeholder="quietwallflower"
                className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
              />

              <p className="mt-2 text-xs text-white/60">
                Letters, numbers, and underscores only.
              </p>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-white"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-white"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-6 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {message ? (
          <p className="mt-5 rounded-2xl border border-emerald-100/30 bg-emerald-100/15 p-4 text-sm leading-6 text-emerald-50">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-5 rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm leading-6 text-red-50">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </main>
  );
}