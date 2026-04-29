import Link from "next/link";

const plusFeatures = [
  {
    title: "Premium themes",
    description:
      "Seasonal color moods, cozy gradients, illustrated backgrounds, and soft visual styles for your Quietli page.",
  },
  {
    title: "More profile links",
    description:
      "Free profiles get one link. Quietli Plus will let you add more places you want people to find you.",
  },
  {
    title: "Advanced embeds",
    description:
      "Customize how your blips appear on your website, portfolio, blog, or little corner of the internet.",
  },
  {
    title: "Moving backgrounds",
    description:
      "Subtle animated backgrounds designed to feel calm, atmospheric, and personal without becoming distracting.",
  },
  {
    title: "Profile music embeds",
    description:
      "Add a featured song, project, or audio link to your profile without turning your page into a noisy feed.",
  },
  {
    title: "Desktop companion",
    description:
      "A future tiny Quietli desktop window for seeing friends’ blips and posting quick thoughts from your computer.",
  },
];

const themeCards = [
  {
    name: "Autumn Static",
    gradient:
      "linear-gradient(135deg, rgba(237,137,91,0.82), rgba(158,84,111,0.78), rgba(84,57,94,0.86))",
  },
  {
    name: "Rainy Window",
    gradient:
      "linear-gradient(135deg, rgba(104,142,174,0.82), rgba(123,110,166,0.78), rgba(86,71,111,0.86))",
  },
  {
    name: "Night Garden",
    gradient:
      "linear-gradient(135deg, rgba(44,93,83,0.84), rgba(70,71,125,0.8), rgba(54,38,82,0.88))",
  },
];

export default function PlusPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
              Quietli Plus
            </p>

            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Make your little corner feel more like yours.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">
              Quietli Plus is our future premium layer for people who want more
              atmosphere, more customization, and more ways to place their blips
              around the internet.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#642B73] transition hover:bg-white/90"
              >
                Back to Quietli
              </Link>

              <Link
                href="/discover"
                className="rounded-full border border-white/30 bg-white/20 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/30"
              >
                Browse Discover
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white/15 p-4 backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-white/15 p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-14 w-14 rounded-full border-2 border-white/60 bg-white/25" />
                <div>
                  <p className="text-xl font-bold text-white">@wallflower</p>
                  <p className="text-sm text-white/70">quiet custom corner</p>
                </div>
              </div>

              <div
                className="rounded-[1.5rem] p-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(237,137,91,0.82), rgba(158,84,111,0.78), rgba(84,57,94,0.86))",
                }}
              >
                <p className="text-base font-bold leading-7 text-white">
                  some thoughts feel better when they have their own weather.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {themeCards.map((theme) => (
                  <div
                    key={theme.name}
                    className="h-16 rounded-[1rem] border border-white/25"
                    style={{ background: theme.gradient }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {themeCards.map((theme) => (
          <div
            key={theme.name}
            className="rounded-[2rem] border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl"
          >
            <div
              className="mb-4 h-32 rounded-[1.5rem] border border-white/20"
              style={{ background: theme.gradient }}
            />

            <h2 className="text-xl font-bold">{theme.name}</h2>

            <p className="mt-2 text-sm leading-6 text-white/75">
              A possible Plus theme mood for people who want their profile to
              feel like a tiny place.
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
            What Plus may include
          </p>

          <h2 className="text-4xl font-bold">Extra expression, not extra pressure.</h2>

          <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
            Free Quietli should always feel complete. Plus is for people who
            want deeper customization, richer embeds, and more atmosphere.
            Safety features like privacy, mute, remove follower, and block
            should stay free.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plusFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[1.5rem] border border-white/20 bg-white/15 p-5"
            >
              <h3 className="text-xl font-bold">{feature.title}</h3>

              <p className="mt-3 text-sm leading-7 text-white/75">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/20 p-8 text-center text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Coming soon
        </p>

        <h2 className="text-4xl font-bold">No subscription yet.</h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/80">
          Quietli Plus is not active yet. For now, this page is a preview of the
          direction we are exploring for future premium features.
        </p>
      </section>
    </main>
  );
}