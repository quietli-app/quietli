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

  const quickLinkClass =
    "rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-6 sm:px-6 sm:py-10">
      <div className="space-y-5">
        <AccountSettingsForm email={user.email ?? null} />

        <section>
          <AccountPlanCard plan={profile?.plan ?? "free"} />
        </section>

        <section>
          <AccountDataTools userId={user.id} email={user.email ?? null} />
        </section>

        <section className="rounded-[2rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                Navigation
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                Quick links
              </h2>
            </div>

            <p className="max-w-md text-sm font-light leading-6 text-white/65">
              Jump around Quietli without digging through the menu.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {profile?.username ? (
              <Link
                href={`/profile/${profile.username}`}
                className={quickLinkClass}
              >
                My Page
              </Link>
            ) : null}

            <Link href="/discover" className={quickLinkClass}>
              Discover
            </Link>

            <Link href="/plus" className={quickLinkClass}>
              Plus
            </Link>

            <Link href="/" className={quickLinkClass}>
              Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}