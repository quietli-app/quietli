"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountSettingsFormProps = {
  email: string | null;
};

export function AccountSettingsForm({ email }: AccountSettingsFormProps) {
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Your password has been updated.");
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 sm:text-sm">
          Account
        </p>

        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Settings
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-white/78 sm:mt-4 sm:text-base sm:leading-8">
          Manage your Quietli login and account details.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Login
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              Email
            </h2>
          </div>

          <p className="max-w-md text-sm font-light leading-6 text-white/70">
            This is the email you use to sign in to Quietli.
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/20 bg-white/15 p-4 text-sm text-white/90 sm:text-base">
          <span className="block break-words">{email || "No email found"}</span>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Security
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              Change password
            </h2>
          </div>

          <p className="max-w-md text-sm font-light leading-6 text-white/70">
            Choose a new password for your Quietli account.
          </p>
        </div>

        <form onSubmit={updatePassword} className="mt-5 grid gap-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-semibold text-white"
            >
              New password
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-base text-[#642B73] outline-none placeholder:text-[#8f6a99] focus:border-white/70 focus:bg-white/80"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-semibold text-white"
            >
              Confirm new password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/30 bg-white/70 px-4 py-3 text-base text-[#642B73] outline-none placeholder:text-[#8f6a99] focus:border-white/70 focus:bg-white/80"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-1 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:py-2.5"
          >
            {isSaving ? "Updating..." : "Update password"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-100/30 bg-emerald-100/15 p-4 text-sm leading-6 text-emerald-50">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-red-100/30 bg-red-100/15 p-4 text-sm leading-6 text-red-50">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}