import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function TopNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    username = profile?.username ?? null;
  }

  async function signOut() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect("/");
  }

  const desktopLinkClass =
    "rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30";

  const mobilePrimaryLinkClass =
    "block rounded-2xl px-5 py-4 text-base font-semibold text-white transition hover:bg-white/20";

  const mobileSecondaryLinkClass =
    "block rounded-2xl px-5 py-4 text-base font-medium text-white/80 transition hover:bg-white/20 hover:text-white";

  return (
    <header className="nav-bar sticky top-0 z-50 border-b border-white/20">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-v3.png"
            alt="Quietli logo"
            width={58}
            height={58}
            className="rounded-md -translate-y-[1px]"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center justify-end gap-3 md:flex">
          <Link href="/discover" className={desktopLinkClass}>
            Discover
          </Link>

          <Link href="/plus" className={desktopLinkClass}>
            Plus
          </Link>

          {username ? (
            <Link href={`/profile/${username}`} className={desktopLinkClass}>
              My page
            </Link>
          ) : null}

          {user ? (
            <Link href="/settings" className={desktopLinkClass}>
              Settings
            </Link>
          ) : null}

          {user ? (
            <form action={signOut}>
              <button type="submit" className={desktopLinkClass}>
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className={desktopLinkClass}>
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <details className="group relative md:hidden">
          <summary className="list-none cursor-pointer rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30">
            Menu
          </summary>

          <div className="absolute right-0 top-14 z-50 w-[calc(100vw-40px)] !max-w-[360px] overflow-hidden rounded-[30px] border border-white/20 bg-[#8f87dc] p-3 text-white shadow-2xl shadow-black/20">
            <div className="mb-2 rounded-[24px] bg-white/10 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                Quietli
              </p>

              <p className="mt-1 text-lg font-semibold text-white">
                {username ? `@${username}` : "Welcome"}
              </p>
            </div>

            <Link href="/discover" className={mobilePrimaryLinkClass}>
              Discover
            </Link>

            <Link href="/plus" className={mobilePrimaryLinkClass}>
              Plus
            </Link>

            {username ? (
              <Link
                href={`/profile/${username}`}
                className={mobilePrimaryLinkClass}
              >
                My page
              </Link>
            ) : null}

            {user ? (
              <Link href="/settings" className={mobilePrimaryLinkClass}>
                Settings
              </Link>
            ) : null}

            <div className="my-2 h-px bg-white/20" />

            <Link href="/privacy" className={mobileSecondaryLinkClass}>
              Privacy
            </Link>

            <Link href="/terms" className={mobileSecondaryLinkClass}>
              Terms
            </Link>

            <Link href="/contact" className={mobileSecondaryLinkClass}>
              Contact
            </Link>

            <div className="my-2 h-px bg-white/20" />

            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full rounded-2xl bg-white px-5 py-4 text-left text-base font-semibold text-[#642b73] transition hover:bg-white/90"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="block rounded-2xl bg-white px-5 py-4 text-center text-base font-semibold text-[#642b73] transition hover:bg-white/90"
              >
                Sign in
              </Link>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}