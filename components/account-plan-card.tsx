import Link from "next/link";

type AccountPlanCardProps = {
  plan: string | null;
};

export function AccountPlanCard({ plan }: AccountPlanCardProps) {
  const currentPlan = plan === "plus" ? "plus" : "free";
  const isPlus = currentPlan === "plus";

  return (
    <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-normal uppercase tracking-[0.18em] text-white/60">
            Plan
          </p>

          <h2 className="text-2xl font-semibold">
            {isPlus ? "Quietli Plus" : "Quietli Free"}
          </h2>

          <p className="mt-3 max-w-2xl text-base font-normal leading-7 text-white/75">
            {isPlus
              ? "You are currently on Quietli Plus. Future Plus features will unlock extra customization, richer embeds, more profile links, and premium visual options."
              : "You are currently on the free Quietli plan. Free accounts include posting, following, privacy controls, blocking, muting, one profile link, and basic embeds."}
          </p>
        </div>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-normal ${
            isPlus
              ? "border-white/30 bg-white text-[#642B73]"
              : "border-white/25 bg-white/15 text-white/80"
          }`}
        >
          {isPlus ? "Plus" : "Free"}
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/15 p-4">
        <p className="text-sm font-normal leading-6 text-white/75">
          Plus is not connected to payments yet. For now, this plan setting gives
          us the structure to build and test future Plus features safely.
        </p>

        <Link
          href="/plus"
          className="mt-4 inline-flex rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white transition hover:bg-white/30"
        >
          View Plus preview
        </Link>
      </div>
    </section>
  );
}