export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Quietli
        </p>

        <h1 className="text-4xl font-bold">Terms of Use</h1>

        <p className="mt-4 text-sm leading-7 text-white/70">
          Last updated: April 2026
        </p>

        <div className="mt-8 grid gap-7 text-base leading-8 text-white/82">
          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Using Quietli
            </h2>

            <p>
              Quietli is a place for posting short thoughts, observations,
              notes, and personal expressions. By using Quietli, you agree to
              use the service respectfully and responsibly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Your account
            </h2>

            <p>
              You are responsible for keeping your account login information
              secure. Do not use someone else’s account or attempt to access
              areas of Quietli you are not authorized to access.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              User content
            </h2>

            <p>
              You are responsible for the blips, profile information, images,
              and links you add to Quietli. Do not post content that is illegal,
              abusive, harassing, threatening, exploitative, hateful, or
              intentionally harmful to others.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Content moderation
            </h2>

            <p>
              Quietli may remove content or restrict accounts that appear to
              violate these terms, harm other users, abuse the service, or create
              security, spam, or safety concerns.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              No popularity mechanics
            </h2>

            <p>
              Quietli is intentionally designed without likes, visible scores,
              public popularity metrics, or reply-driven engagement features.
              Users should not attempt to manipulate, spam, or abuse the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Links and third-party content
            </h2>

            <p>
              Users may add profile links. Quietli is not responsible for the
              content, security, or practices of external websites linked by
              users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Changes to Quietli
            </h2>

            <p>
              Quietli may change, update, pause, or discontinue parts of the
              service over time as the product evolves.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">Contact</h2>

            <p>
              Questions about these terms can be sent through the contact page.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}