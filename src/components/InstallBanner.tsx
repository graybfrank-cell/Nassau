"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nassau_install_dismiss_at";
const VISIT_KEY = "nassau_install_visit_count";
const DISMISS_DAYS = 7;

// Public pages where we don't want to show the install banner
const PUBLIC_PREFIXES = ["/", "/login", "/privacy", "/terms", "/blog", "/explore"];

export default function InstallBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show on public pages
    const isPublic =
      pathname === "/" ||
      PUBLIC_PREFIXES.some(
        (p) => p !== "/" && pathname?.startsWith(p)
      );
    if (isPublic) return;

    // Already installed as PWA — skip
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // Safari-specific
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;

    // Mobile-only
    const ua = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    if (!isMobile) return;

    // Respect dismissal window
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) {
      return;
    }

    // Only show after 2+ page visits
    const visits = Number(sessionStorage.getItem(VISIT_KEY) || 0) + 1;
    sessionStorage.setItem(VISIT_KEY, String(visits));
    if (visits < 2) return;

    const iosDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(iosDevice);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS doesn't fire beforeinstallprompt — show manual instructions
    if (iosDevice) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [pathname]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-[slideUp_.25s_ease-out] px-4 pb-4 sm:pb-6">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#18181B] p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D5A3D]">
            <span className="font-bold text-white">N</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Add Nassau to your home screen
            </p>
            {isIOS ? (
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                Tap <span className="font-semibold">Share</span> then{" "}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                Install Nassau for the best experience on the course.
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  type="button"
                  onClick={install}
                  className="min-h-[44px] rounded-xl bg-[#2D5A3D] px-4 py-2 text-sm font-semibold text-white"
                >
                  Install
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium text-white/70"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
