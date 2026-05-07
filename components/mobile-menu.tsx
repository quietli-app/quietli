"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MobileMenuProps = {
  username: string | null;
  isSignedIn: boolean;
  signOutAction: () => Promise<void>;
};

export function MobileMenu({
  username,
  isSignedIn,
  signOutAction,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function closeMenu() {
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const mobilePrimaryLinkClass =
    "block rounded-2xl px-5 py-4 text-base font-semibold text-white transition hover:bg-white/20";

  const mobileSecondaryLinkClass =
    "block rounded-2xl px-5 py-4 text-base font-medium text-white/80 transition hover:bg-white/20 hover:text-white";

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30"
        aria-expanded={isOpen}
        aria-label="Open menu"
      >
        Menu
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-50 w-[calc(100vw-40px)] !max-w-[360px] overflow-hidden rounded-[30px] border border-white/20 bg-[#8f87dc] p-3 text-white shadow-2xl shadow-black/20">
          <div className="mb-2 rounded-[24px] bg-white/10 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              Quietli
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {username ? `@${username}` : "Welcome"}
            </p>
          </div>

          <Link
            href="/discover"
            onClick={closeMenu}
            className={mobilePrimaryLinkClass}
          >
            Discover
          </Link>

          <Link
            href="/plus"
            onClick={closeMenu}
            className={mobilePrimaryLinkClass}
          >
            Plus
          </Link>

          {username ? (
            <Link
              href={`/profile/${username}`}
              onClick={closeMenu}
              className={mobilePrimaryLinkClass}
            >
              My page
            </Link>
          ) : null}

          {isSignedIn ? (
            <Link
              href="/settings"
              onClick={closeMenu}
              className={mobilePrimaryLinkClass}
            >
              Settings
            </Link>
          ) : null}

          <div className="my-2 h-px bg-white/20" />

          <Link
            href="/privacy"
            onClick={closeMenu}
            className={mobileSecondaryLinkClass}
          >
            Privacy
          </Link>

          <Link
            href="/terms"
            onClick={closeMenu}
            className={mobileSecondaryLinkClass}
          >
            Terms
          </Link>

          <Link
            href="/contact"
            onClick={closeMenu}
            className={mobileSecondaryLinkClass}
          >
            Contact
          </Link>

          <div className="my-2 h-px bg-white/20" />

          {isSignedIn ? (
            <form action={signOutAction}>
              <button
                type="submit"
                onClick={closeMenu}
                className="block w-full rounded-2xl bg-white px-5 py-4 text-left text-base font-semibold text-[#642b73] transition hover:bg-white/90"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              className="block rounded-2xl bg-white px-5 py-4 text-center text-base font-semibold text-[#642b73] transition hover:bg-white/90"
            >
              Sign in
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}