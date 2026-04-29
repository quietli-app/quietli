export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Quietli
        </p>

        <h1 className="text-4xl font-bold">Contact</h1>

        <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
          Have a question, issue, or note about Quietli? You can reach out using
          the email below.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/20 bg-white/15 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
            Email
          </p>

          <a
            href="mailto:hello@quietli.io"
            className="mt-2 inline-flex text-2xl font-bold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
          >
            hello@quietli.io
          </a>
        </div>

        <p className="mt-6 text-sm leading-7 text-white/65">
          For account issues, please include your Quietli username and the email
          address connected to your account.
        </p>
      </section>
    </main>
  );
}