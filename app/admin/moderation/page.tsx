import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModerationReviewButton } from "@/components/moderation-review-button";

type ModerationFlag = {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  flag_type: string;
  reason: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewer_note: string | null;
};

export default async function ModerationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_current_user_admin"
  );

  if (adminError || !isAdmin) {
    redirect("/");
  }

  const { data, error } = await supabase.rpc("get_moderation_flags");

  const flags = (data ?? []) as ModerationFlag[];

  const openFlags = flags.filter((flag) => !flag.reviewed);
  const reviewedFlags = flags.filter((flag) => flag.reviewed);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-6 rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-normal uppercase tracking-[0.2em] text-white/65">
          Admin
        </p>

        <h1 className="text-4xl font-semibold">Moderation</h1>

        <p className="mt-4 max-w-2xl text-base font-normal leading-8 text-white/80">
          Review users who triggered suspicious posting behavior or other
          moderation flags.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Back home
          </Link>

          <Link
            href="/settings"
            className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-normal text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Settings
          </Link>
        </div>
      </section>

      {error ? (
        <section className="rounded-[2rem] border border-red-100/30 bg-red-100/15 p-6 text-white backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Could not load flags.</h2>

          <p className="mt-3 text-sm leading-6 text-white/75">
            {error.message}
          </p>
        </section>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl">
          <p className="text-sm font-normal text-white/65">Open flags</p>
          <p className="mt-2 text-4xl font-semibold">{openFlags.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl">
          <p className="text-sm font-normal text-white/65">Reviewed</p>
          <p className="mt-2 text-4xl font-semibold">{reviewedFlags.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl">
          <p className="text-sm font-normal text-white/65">Total</p>
          <p className="mt-2 text-4xl font-semibold">{flags.length}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Open flags</h2>

        {openFlags.length === 0 ? (
          <p className="mt-4 text-sm font-normal leading-6 text-white/75">
            No open moderation flags right now.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {openFlags.map((flag) => (
              <article
                key={flag.id}
                className="rounded-[1.5rem] border border-white/20 bg-white/15 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/30 bg-white/20">
                      {flag.avatar_url ? (
                        <img
                          src={flag.avatar_url}
                          alt={flag.username ?? "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-normal text-white/80">
                          ?
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-lg font-medium">
                        @{flag.username ?? "unknown"}
                      </p>

                      <p className="text-xs font-normal text-white/55">
                        {flag.user_id}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-normal uppercase tracking-[0.18em] text-white/75">
                    Open
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm font-normal leading-6 text-white/78">
                  <p>
                    <span className="text-white/55">Type:</span>{" "}
                    {flag.flag_type}
                  </p>

                  <p>
                    <span className="text-white/55">Reason:</span>{" "}
                    {flag.reason}
                  </p>

                  <p>
                    <span className="text-white/55">Created:</span>{" "}
                    {new Date(flag.created_at).toLocaleString()}
                  </p>

                  {flag.username ? (
                    <Link
                      href={`/profile/${flag.username}`}
                      className="w-fit text-sm font-normal text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
                    >
                      View profile
                    </Link>
                  ) : null}
                </div>

                <ModerationReviewButton flagId={flag.id} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/20 p-6 text-white backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Reviewed flags</h2>

        {reviewedFlags.length === 0 ? (
          <p className="mt-4 text-sm font-normal leading-6 text-white/75">
            No reviewed flags yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {reviewedFlags.map((flag) => (
              <article
                key={flag.id}
                className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 opacity-75"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-medium">
                      @{flag.username ?? "unknown"}
                    </p>

                    <p className="mt-1 text-sm font-normal text-white/60">
                      {flag.flag_type}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-normal uppercase tracking-[0.18em] text-white/60">
                    Reviewed
                  </span>
                </div>

                <p className="mt-4 text-sm font-normal leading-6 text-white/70">
                  {flag.reason}
                </p>

                {flag.reviewer_note ? (
                  <p className="mt-3 rounded-[1rem] border border-white/10 bg-white/10 p-3 text-sm font-normal leading-6 text-white/70">
                    Note: {flag.reviewer_note}
                  </p>
                ) : null}

                <p className="mt-3 text-xs font-normal text-white/45">
                  Reviewed{" "}
                  {flag.reviewed_at
                    ? new Date(flag.reviewed_at).toLocaleString()
                    : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}