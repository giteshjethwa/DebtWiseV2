import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar, MobileNav } from "@/components/AppShell";
import { getSession, getProfile, useStore } from "@/lib/store";
import { Bell, Plus } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getSession()) {
      window.location.href = "/auth";
    } else {
      setReady(true);
    }
  }, []);

  const profile = useStore(() => getProfile());

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <MobileNav />
      <main className="lg:ml-64 pb-28 lg:pb-10">
        {/* Top bar (mobile-visible action area) */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-bold">
              D
            </div>
            <span className="text-base font-bold tracking-tight">DebtWise</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative grid place-items-center size-9 rounded-full bg-muted text-muted-foreground"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-warning ring-2 ring-background" />
            </Link>
            <Link
              to="/loans/add"
              className="grid place-items-center size-9 rounded-full bg-accent text-accent-foreground shadow-card"
            >
              <Plus className="size-4" />
            </Link>
            <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold text-primary">
              {(profile?.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
