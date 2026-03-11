"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Check, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  avatar_url: string;
  venmo_username: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/profile");
      if (res.ok) {
        const p: Profile = await res.json();
        setProfile(p);
        setFullName(p.full_name || "");
        setVenmoUsername(p.venmo_username || "");
      }
      setLoading(false);
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          venmo_username: venmoUsername,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#1A1A1A]">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1A1A1A] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#F3EDE4]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#242424] border border-zinc-700">
              <User className="h-6 w-6 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F3EDE4]">Profile</h1>
              <p className="text-sm text-zinc-400">{profile?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Grayson Frank"
              className="mt-1.5 block w-full rounded-lg border border-zinc-700 bg-[#242424] px-3 py-2.5 text-sm text-[#F3EDE4] placeholder:text-zinc-500 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
            />
          </div>

          {/* Venmo Username */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Venmo Username
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                @
              </span>
              <input
                type="text"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value)}
                placeholder="John-Doe-42"
                className="block w-full rounded-lg border border-zinc-700 bg-[#242424] py-2.5 pl-7 pr-3 text-sm text-[#F3EDE4] placeholder:text-zinc-500 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Used for quick settlements. Your friends can pay you directly
              through Venmo.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D94F2B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c04425] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </form>

        {/* Subscription Info */}
        {profile?.subscription_status && profile.subscription_status !== "free" && (
          <div className="mt-8 rounded-xl border border-zinc-700 bg-[#242424] p-5">
            <h3 className="text-sm font-medium text-[#F3EDE4]">
              Subscription
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {profile.subscription_tier?.charAt(0).toUpperCase()}
              {profile.subscription_tier?.slice(1)} plan &middot;{" "}
              {profile.subscription_status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
