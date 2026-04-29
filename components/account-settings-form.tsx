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
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-white/60">
          Account
        </p>

        <h1 className="text-4xl font-bold">Settings</h1>

        <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
          Manage your Quietli login and account details.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-bold">Email</h2>

        <p className="mt-3 text-base leading-7 text-white/75">
          This is the email you use to sign in to Quietli.
        </p>

        <div className="mt-4 rounded-[1.25rem] border border-white/20 bg-white/15 p-4 text-white/90">
          {email || "No email found"}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-bold">Change password</h2>

        <p className="mt-3 text-base leading-7 text-white/75">
          Choose a new password for your Quietli account.
        </p>

        <form onSubmit={updatePassword} className="mt-5 grid gap-4">
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
              className="w-full rounded-2xl border border-white/30 bg-white/65 px-4 py-3 text-[#642B73] outline-none placeholder:text-[#8f6a99]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-fit rounded-full bg-white px-5 py-2 text-sm font-bold text-[#642B73] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
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