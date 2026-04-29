import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/55">
        <span>Quietli · social media for wallflowers</span>

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
    </footer>
  );
}