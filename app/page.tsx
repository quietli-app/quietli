import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlipComposer } from "@/components/blip-composer";
import { BlipCard } from "@/components/blip-card";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const floatingBlips = [
  "a tiny thought drifting by",
  "soft signal",
  "today felt strange but kind",
  "not everything needs applause",
  "just getting it out",
  "brain weather",
  "a little human static",
  "some thoughts are just passing through",
  "quietly putting this somewhere",
  "not a post, just a blip",
  "half poem, half exhale",
  "no audience required",
  "small words, low stakes",
];

const themeExamples = [
  "linear-gradient(135deg, #f9a8d4, #fecdd3, #ffe4e6)",
  "linear-gradient(135deg, #f472b6, #d8b4fe, #c4b5fd)",
  "linear-gradient(135deg, #fdba74, #f9a8d4, #c084fc)",
  "linear-gradient(135deg, #67e8f9, #93c5fd, #a5b4fc)",
  "linear-gradient(135deg, #a7f3d0, #99f6e4, #a5f3fc)",
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { id: string; username: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", user.id)
      .single();

    if (!data?.username) redirect("/setup");
    profile = data;
  }

  if (!profile) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-16">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {floatingBlips.map((text, index) => (
            <div
              key={text}
              className="floating-blip absolute whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/45 backdrop-blur-md"
              style={{
                top: `${10 + (index % 8) * 10}%`,
                left: `${index % 2 === 0 ? -40 : -60}%`,
                animationDuration: `${55 + (index % 5) * 10}s`,
                animationDelay: `${index * -6}s`,
              }}
            >
              {text}
            </div>
          ))}
        </div>

        <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center text-center">
          <RevealOnScroll>
            <p className="mb-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-xl">
              Quietli
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <h1 className="text-6xl font-bold text-white md:text-7xl">
              Social media for wallflowers.
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={350}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 md:text-xl">
              A quiet place to put a thought into the world without turning it
              into a performance.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={500}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white px-6 py-3 font-bold text-[#642B73]"
              >
                Start blipping
              </Link>

              <a
                href="#ethos"
                className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-xl"
              >
                Read the ethos
              </a>
            </div>
          </RevealOnScroll>
        </section>

        <section id="ethos" className="relative z-10 mx-auto max-w-5xl pb-24">
          <RevealOnScroll>
            <div className="rounded-[2rem] border border-white/20 bg-white/15 p-8 text-center backdrop-blur-xl">
              <h2 className="mb-4 text-3xl font-bold text-white">
                What Quietli is for
              </h2>

              <p className="mx-auto max-w-3xl text-lg leading-9 text-white/85">
                Sometimes a thought does not need to become content. Sometimes
                it just needs to leave your head. Quietli is a calm little place
                for those thoughts: poetic ones, dumb ones, funny ones, mundane
                ones, and private-feeling ones you still want to put somewhere.
              </p>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 text-white/85">
                No likes. No replies. No ratios. No visible popularity contest.
                Just tiny expressions, drifting out into the open.
              </p>
            </div>
          </RevealOnScroll>
        </section>

        <section className="relative z-10 mx-auto max-w-5xl pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            <RevealOnScroll delay={100}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-6 backdrop-blur-xl">
                <div className="mb-5 h-28 rounded-[1.5rem] bg-white/15 p-4">
                  <div className="mb-3 h-3 w-24 rounded-full bg-white/40" />
                  <div className="mb-2 h-3 w-40 rounded-full bg-white/25" />
                  <div className="h-3 w-28 rounded-full bg-white/20" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">
                  Not a popularity contest.
                </h3>
                <p className="text-sm leading-6 text-white/75">
                  Your thoughts do not need hearts, scores, or applause to be
                  worth putting somewhere.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={220}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-6 backdrop-blur-xl">
                <div className="mb-5 flex h-28 items-center justify-center rounded-[1.5rem] bg-white/15">
                  <div className="h-14 w-14 rounded-full border-4 border-white/60" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">
                  A softer kind of posting.
                </h3>
                <p className="text-sm leading-6 text-white/75">
                  Use it like a mental exhale, a note to yourself, or a tiny
                  poem you leave on the internet.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={340}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-6 backdrop-blur-xl">
                <div className="mb-5 grid h-28 grid-cols-2 gap-3 rounded-[1.5rem] bg-white/15 p-3">
                  <div className="rounded-[1rem] bg-white/25" />
                  <div className="rounded-[1rem] bg-white/15" />
                  <div className="rounded-[1rem] bg-white/10" />
                  <div className="rounded-[1rem] bg-white/20" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">
                  Small by design.
                </h3>
                <p className="text-sm leading-6 text-white/75">
                  Quietli is intentionally quiet, simple, and low-pressure.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-5xl pb-24">
          <RevealOnScroll>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Make your little corner feel like yours.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/80">
                Choose a color mood, add a profile picture, write a tiny bio,
                and let your blips carry a visual tone that feels personal.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-4 md:grid-cols-3">
            <RevealOnScroll delay={100}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full border-2 border-white bg-white/20" />
                  <div>
                    <p className="text-xl font-bold text-white">@wallflower</p>
                    <p className="text-sm text-white/70">
                      soft thoughts, low stakes
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(249,168,212,0.75), rgba(254,205,211,0.7), rgba(255,228,230,0.75))",
                  }}
                >
                  <p className="text-sm font-bold text-[#2b0f2f]">
                    Today I remembered that being quiet is not the same as
                    having nothing to say.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={220}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-5 backdrop-blur-xl">
                <p className="mb-4 text-lg font-bold text-white">
                  Choose a color mood
                </p>

                <div className="flex flex-wrap gap-3">
                  {themeExamples.map((theme, index) => (
                    <div
                      key={index}
                      className="h-12 w-12 rounded-full border-2 border-white/70"
                      style={{ background: theme }}
                    />
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-white/75">
                  Each profile can have its own gradient style, so your thoughts
                  feel personal without making the whole feed chaotic.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={340}>
              <div className="rounded-[2rem] border border-white/20 bg-white/15 p-5 backdrop-blur-xl">
                <p className="mb-4 text-lg font-bold text-white">
                  A profile without pressure
                </p>

                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4">
                  <div className="mb-4 h-24 rounded-[1.25rem] bg-white/15" />
                  <div className="mb-2 h-3 w-32 rounded-full bg-white/40" />
                  <div className="h-3 w-48 rounded-full bg-white/20" />
                </div>

                <p className="mt-5 text-sm leading-6 text-white/75">
                  Your page can feel designed, personal, and calm without being
                  a performance.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-5xl pb-24">
          <RevealOnScroll>
            <div className="grid gap-6 rounded-[2rem] border border-white/20 bg-white/15 p-8 backdrop-blur-xl md:grid-cols-[1fr_1.1fr]">
              <div>
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  Let your thoughts live somewhere else, too.
                </h2>

                <p className="mt-5 text-base leading-8 text-white/80">
                  Quietli lets you embed your feed, or just your latest blip, on
                  your website, blog, portfolio, or quiet little corner of the
                  internet.
                </p>

                <p className="mt-5 text-base leading-8 text-white/80">
                  Think of it like a tiny thought window. Your newest blip can
                  drift onto a homepage, sidebar, footer, or personal site
                  without needing another social feed.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-4">
                <div className="mb-4 rounded-[1.25rem] bg-white/15 p-4">
                  <div className="mb-2 h-3 w-28 rounded-full bg-white/40" />
                  <div className="h-3 w-44 rounded-full bg-white/20" />
                </div>

                <div
                  className="flex h-24 items-center gap-3 rounded-[1.5rem] px-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(103,232,249,0.75), rgba(147,197,253,0.7), rgba(165,180,252,0.75))",
                  }}
                >
                  <div className="h-11 w-11 rounded-full border border-white/60 bg-white/30" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#2b0f2f]">
                      @quietsignal
                    </p>
                    <p className="truncate text-base text-[#2b0f2f]">
                      a small thought, floating somewhere else
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.25rem] bg-white/15 p-4 font-mono text-xs leading-6 text-white/70">
                  &lt;iframe src=&quot;/embed/quietsignal&quot;&gt;&lt;/iframe&gt;
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        <section className="relative z-10 mx-auto max-w-4xl pb-32 text-center">
          <RevealOnScroll>
            <h2 className="mb-6 text-4xl font-bold text-white">
              Not everything needs to perform.
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <p className="mx-auto max-w-2xl text-lg leading-9 text-white/80">
              Most platforms turn your thoughts into something that needs to be
              judged, reacted to, or optimized.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={400}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-white/80">
              Quietli is intentionally smaller than that. Quieter than that.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={600}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-white/80">
              It’s a place where a thought can exist without needing to matter.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={800}>
            <div className="mt-12">
              <Link
                href="/login"
                className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-white backdrop-blur-xl"
              >
                Enter quietly →
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </main>
    );
  }

  const { data: blips } = await supabase
    .from("blips")
    .select(
      `
      id,
      user_id,
      content,
      created_at,
      profiles!inner(username, avatar_url, gradient_theme)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <BlipComposer userId={profile.id} />

      <div className="grid gap-4">
        {blips?.map((blip) => {
          const profileData = Array.isArray(blip.profiles)
            ? blip.profiles[0]
            : blip.profiles;

          if (!profileData) return null;

          return (
            <BlipCard
              key={blip.id}
              id={blip.id}
              content={blip.content}
              createdAt={blip.created_at}
              username={profileData.username}
              avatarUrl={profileData.avatar_url}
              gradientTheme={profileData.gradient_theme}
              canDelete={user?.id === blip.user_id}
            />
          );
        })}
      </div>
    </main>
  );
}