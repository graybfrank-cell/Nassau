import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Welcome to Nassau
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Signed in as{" "}
          <span className="font-medium text-zinc-700">{user.email}</span>
        </p>
        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
