import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio")
    .eq("id", user.id)
    .single();

  if (!profile?.username) {
    redirect("/setup");
  }

  const hasAvatar = Boolean(profile.avatar_url);
  const hasBio = Boolean(profile.bio);
  const hasProfileBasics = hasAvatar && hasBio;

  const { count: blipCount } = await supabase
    .from("blips")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasPosted = Boolean(blipCount && blipCount > 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Welcome to Quietli
        </p>

        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Your quiet corner is ready.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">
          Before you start drifting blips into the world, here are a few gentle
          first steps to make Quietli feel like yours.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#642B73] transition hover:bg-white/90"
          >
            Go to home
          </Link>

          <Link
            href={`/profile/${profile.username}`}
            className="rounded-full border border-white/30 bg-white/20 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Edit my page
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-[#642B73]">
            {hasProfileBasics ? "✓" : "1"}
          </div>

          <h2 className="text-2xl font-bold">Make your page yours</h2>

          <p className="mt-3 text-sm leading-7 text-white/75">
            Add a profile picture, write a tiny bio, choose a color mood, and
            add one profile link if you want.
          </p>

          <Link
            href={`/profile/${profile.username}`}
            className="mt-5 inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30"
          >
            Edit profile
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-[#642B73]">
            {hasPosted ? "✓" : "2"}
          </div>

          <h2 className="text-2xl font-bold">Post your first blip</h2>

          <p className="mt-3 text-sm leading-7 text-white/75">
            It does not need to be important. A thought, a sentence, a weird
            little observation. Low stakes.
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30"
          >
            Write a blip
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-[#642B73]">
            3
          </div>

          <h2 className="text-2xl font-bold">Find quiet corners</h2>

          <p className="mt-3 text-sm leading-7 text-white/75">
            Discover public profiles and follow a few people whose blips you
            want drifting through your feed.
          </p>

          <Link
            href="/discover"
            className="mt-5 inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30"
          >
            Open Discover
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <h2 className="text-3xl font-bold">A quick note about the vibe</h2>

        <div className="mt-5 grid gap-4 text-base leading-8 text-white/80 md:grid-cols-2">
          <p>
            Quietli is intentionally small and calm. No likes, no ratios, no
            public popularity contest.
          </p>

          <p>
            Use privacy, mute, remove follower, and block whenever you need to
            keep your corner feeling comfortable.
          </p>
        </div>
      </section>
    </main>
  );
}