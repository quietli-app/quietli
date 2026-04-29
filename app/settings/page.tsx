import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { AccountDataTools } from "@/components/account-data-tools";
import { AccountPlanCard } from "@/components/account-plan-card";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, plan")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AccountSettingsForm email={user.email ?? null} />

      <section className="mt-5">
        <AccountPlanCard plan={profile?.plan ?? "free"} />
      </section>

      <section className="mt-5">
        <AccountDataTools userId={user.id} email={user.email ?? null} />
      </section>

      <section className="mt-5 rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Quick links</h2>

        <div className="mt-5 flex flex-wrap gap-3">
          {profile?.username ? (
            <Link
              href={`/profile/${profile.username}`}
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
            >
              My Page
            </Link>
          ) : null}

          <Link
            href="/discover"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Discover
          </Link>

          <Link
            href="/plus"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Plus
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}