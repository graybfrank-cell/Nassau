"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function TopBar() {
  const [initials, setInitials] = useState("");
  const [hasUnsettled, setHasUnsettled] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.fullName) {
          const parts = data.fullName.trim().split(" ");
          setInitials(
            parts[0][0] +
              (parts.length > 1 ? parts[parts.length - 1][0] : "")
          );
        }
      })
      .catch(() => {});

    fetch("/api/settlements?status=pending")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHasUnsettled(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <Link href="/dashboard">
        <span className="text-xl font-black uppercase tracking-tighter text-cream">
          NASSAU
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/settlements" className="relative">
          <Bell className="h-5 w-5 text-cream/40 hover:text-cream/60 transition-colors cursor-pointer" />
          {hasUnsettled && (
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-coral" />
          )}
        </Link>
        <Link href="/profile">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center text-[11px] font-medium text-dark">
            {initials}
          </div>
        </Link>
      </div>
    </div>
  );
}
