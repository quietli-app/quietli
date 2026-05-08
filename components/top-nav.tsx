import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/mobile-menu";

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

  return (
    <header
      className="nav-bar sticky top-0 z-50 border-b border-white/20 backdrop-blur-xl"
      style={{
        background: "var(--nav-bg, rgba(255, 255, 255, 0.16))",
      }}
    >
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
        <MobileMenu
          username={username}
          isSignedIn={Boolean(user)}
          signOutAction={signOut}
        />
      </div>
    </header>
  );
}