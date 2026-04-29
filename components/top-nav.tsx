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
          <Link
            href="/discover"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Discover
          </Link>

          <Link
            href="/plus"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Plus
          </Link>

          {username ? (
            <Link
              href={`/profile/${username}`}
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
            >
              My page
            </Link>
          ) : null}

          {user ? (
            <Link
              href="/settings"
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
            >
              Settings
            </Link>
          ) : null}

          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <details className="group relative md:hidden">
          <summary className="list-none cursor-pointer rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30">
            Menu
          </summary>

          <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-[1.5rem] border border-white/25 bg-white/20 p-2 text-white shadow-2xl backdrop-blur-xl">
            <Link
              href="/discover"
              className="block rounded-[1rem] px-4 py-3 text-sm font-medium transition hover:bg-white/20"
            >
              Discover
            </Link>

            <Link
              href="/plus"
              className="block rounded-[1rem] px-4 py-3 text-sm font-medium transition hover:bg-white/20"
            >
              Plus
            </Link>

            {username ? (
              <Link
                href={`/profile/${username}`}
                className="block rounded-[1rem] px-4 py-3 text-sm font-medium transition hover:bg-white/20"
              >
                My page
              </Link>
            ) : null}

            {user ? (
              <Link
                href="/settings"
                className="block rounded-[1rem] px-4 py-3 text-sm font-medium transition hover:bg-white/20"
              >
                Settings
              </Link>
            ) : null}

            <div className="my-2 h-px bg-white/20" />

            <Link
              href="/privacy"
              className="block rounded-[1rem] px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/20 hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="block rounded-[1rem] px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/20 hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/contact"
              className="block rounded-[1rem] px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/20 hover:text-white"
            >
              Contact
            </Link>

            <div className="my-2 h-px bg-white/20" />

            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full rounded-[1rem] px-4 py-3 text-left text-sm font-medium transition hover:bg-white/20"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="block rounded-[1rem] px-4 py-3 text-sm font-medium transition hover:bg-white/20"
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