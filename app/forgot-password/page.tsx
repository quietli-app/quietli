"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function sendResetEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Check your email for a Quietli password reset link. If you do not see it, check spam or promotions."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <Link href="/login" className="text-sm font-medium text-white/75">
            ← Back to sign in
          </Link>

          <h1 className="mt-5 text-4xl font-bold">Reset your password</h1>

          <p className="mt-3 text-sm leading-6 text-white/75">
            Enter the email connected to your Quietli account and we’ll send you
            a reset link.
          </p>
        </div>

        <form onSubmit={sendResetEmail} className="grid gap-4">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
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