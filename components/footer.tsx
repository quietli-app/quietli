import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-8 pt-8 text-center">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-normal text-white/55">
          <span>Quietli · Social media for wallflowers</span>

          <span className="hidden text-white/25 sm:inline">·</span>

          <Link href="/privacy" className="transition hover:text-white/85">
            Privacy
          </Link>

          <Link href="/terms" className="transition hover:text-white/85">
            Terms
          </Link>

          <Link href="/contact" className="transition hover:text-white/85">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}