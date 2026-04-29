export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-[2rem] border border-white/20 bg-white/20 p-8 text-white backdrop-blur-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/65">
          Quietli
        </p>

        <h1 className="text-4xl font-bold">Privacy Policy</h1>

        <p className="mt-4 text-sm leading-7 text-white/70">
          Last updated: April 2026
        </p>

        <div className="mt-8 grid gap-7 text-base leading-8 text-white/82">
          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              What Quietli collects
            </h2>

            <p>
              Quietli collects the information needed to create and maintain
              your account, including your email address, username, password
              authentication data, profile details, profile image, profile link,
              privacy settings, follows, mutes, blocks, and the blips you post.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              How your information is used
            </h2>

            <p>
              We use your information to provide the Quietli service, including
              account login, profile pages, posting blips, showing feeds,
              managing privacy controls, displaying follows, and letting users
              manage their own settings.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Public content
            </h2>

            <p>
              If your profile is public, your public profile information and
              blips may be visible to other users and visitors. If your profile
              is private, your blips are intended to be visible only to approved
              followers and yourself.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Account security
            </h2>

            <p>
              Quietli uses Supabase for authentication, database storage, and
              related account infrastructure. Passwords are handled through the
              authentication provider and are not displayed to Quietli users or
              admins in plain text.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Email communication
            </h2>

            <p>
              Quietli may send transactional emails, such as account
              confirmation emails and password reset emails. These emails are
              used to help you access and secure your account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Third-party services
            </h2>

            <p>
              Quietli currently uses third-party services for hosting,
              authentication, database functionality, and transactional email.
              These services may process limited data as needed to operate the
              site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Your choices
            </h2>

            <p>
              You can edit your profile, update your privacy setting, delete
              your own blips, mute users, block users, remove followers, and
              change your password from your Quietli account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-bold text-white">Contact</h2>

            <p>
              Questions about this privacy policy can be sent through the
              contact page.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}