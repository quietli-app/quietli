"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPreparingSession, setIsPreparingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function prepareResetSession() {
      setIsPreparingSession(true);
      setErrorMessage("");

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setErrorMessage(
            "This password reset link is invalid or expired. Please request a new one."
          );
          setIsPreparingSession(false);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage(
          "This password reset link is invalid or expired. Please request a new one."
        );
      }

      setIsPreparingSession(false);
    }

    prepareResetSession();
  }, [searchParams, supabase.auth]);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Please choose a password with at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Your password has been updated. Redirecting you to Quietli...");

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <Link href="/login" className="text-sm font-medium text-white/75">
            ← Back to sign in
          </Link>

          <h1 className="mt-5 text-4xl font-bold">Choose a new password</h1>

          <p className="mt-3 text-sm leading-6 text-white/75">
            Enter a new password for your Quietli account.
          </p>
        </div>

        {isPreparingSession ? (
          <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-sm leading-6 text-white/80">
            Checking your reset link...
          </div>
        ) : errorMessage &&
          errorMessage.includes("invalid or expired") ? (
          <div className="grid gap-4">
            <p className="rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm leading-6 text-red-50">
              {errorMessage}
            </p>

            <Link
              href="/forgot-password"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#642B73] transition hover:bg-white/90"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={updatePassword} className="grid gap-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-bold text-white"
              >
                New password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-bold text-white"
              >
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {message ? (
          <p className="mt-5 rounded-2xl border border-emerald-100/30 bg-emerald-100/15 p-4 text-sm leading-6 text-emerald-50">
            {message}
          </p>
        ) : null}

        {errorMessage && !errorMessage.includes("invalid or expired") ? (
          <p className="mt-5 rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm leading-6 text-red-50">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </main>
  );
}