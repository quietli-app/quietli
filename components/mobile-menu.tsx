"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function closeMenu() {
    setIsOpen(false);
  }

  function goTo(path: string) {
    setIsOpen(false);
    router.push(path);
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

  const mobilePrimaryButtonClass =
    "flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-base font-semibold text-white transition hover:bg-white/20 active:bg-white/25";

  const mobileSecondaryButtonClass =
    "flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-base font-medium text-white/80 transition hover:bg-white/20 hover:text-white active:bg-white/25";

  const mobileArrowClass = "ml-4 text-xl font-light text-white/45";

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

          <button
            type="button"
            onClick={() => goTo("/discover")}
            className={mobilePrimaryButtonClass}
          >
            <span>Discover</span>
            <span className={mobileArrowClass}>›</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/plus")}
            className={mobilePrimaryButtonClass}
          >
            <span>Plus</span>
            <span className={mobileArrowClass}>›</span>
          </button>

          {username ? (
            <button
              type="button"
              onClick={() => goTo(`/profile/${username}`)}
              className={mobilePrimaryButtonClass}
            >
              <span>My page</span>
              <span className={mobileArrowClass}>›</span>
            </button>
          ) : null}

          {isSignedIn ? (
            <button
              type="button"
              onClick={() => goTo("/settings")}
              className={mobilePrimaryButtonClass}
            >
              <span>Settings</span>
              <span className={mobileArrowClass}>›</span>
            </button>
          ) : null}

          <div className="my-2 h-px bg-white/20" />

          <button
            type="button"
            onClick={() => goTo("/privacy")}
            className={mobileSecondaryButtonClass}
          >
            <span>Privacy</span>
            <span className={mobileArrowClass}>›</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/terms")}
            className={mobileSecondaryButtonClass}
          >
            <span>Terms</span>
            <span className={mobileArrowClass}>›</span>
          </button>

          <button
            type="button"
            onClick={() => goTo("/contact")}
            className={mobileSecondaryButtonClass}
          >
            <span>Contact</span>
            <span className={mobileArrowClass}>›</span>
          </button>

          <div className="my-2 h-px bg-white/20" />

          {isSignedIn ? (
            <form action={signOutAction} className="w-full">
              <button
                type="submit"
                onClick={closeMenu}
                className="flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-center text-base font-semibold text-[#642b73] transition hover:bg-white/90 active:bg-white/80"
              >
                Sign out
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => goTo("/login")}
              className="flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-center text-base font-semibold text-[#642b73] transition hover:bg-white/90 active:bg-white/80"
            >
              Sign in
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}