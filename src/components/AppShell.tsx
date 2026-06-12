import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  Target,
  Bell,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { signOut, getProfile, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/loans", label: "My Loans", icon: Wallet },
  { to: "/strategy", label: "Strategy", icon: Target },
  { to: "/notifications", label: "Reminders", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useStore(() => getProfile());

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-sidebar lg:flex lg:flex-col z-40">
      <div className="flex h-full flex-col p-6">
        <Link to="/dashboard" className="mb-10 flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold tracking-tight shadow-card">
            D
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight text-primary">DebtWise</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Debt Clarity
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const active =
              item.to === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          to="/loans/add"
          className="mt-4 mb-6 flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-card"
        >
          <Plus className="size-4" /> Add Loan
        </Link>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 px-1">
            <div className="size-10 rounded-full bg-muted grid place-items-center text-sm font-semibold text-primary">
              {(profile?.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{profile?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <button
              aria-label="Sign out"
              onClick={signOut}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 items-center border-t border-border bg-surface/95 backdrop-blur-md px-2 py-2 lg:hidden">
      {items.map((item) => {
        const active =
          item.to === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-accent" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
