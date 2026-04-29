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

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/discover"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Discover
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
      </div>
    </header>
  );
}