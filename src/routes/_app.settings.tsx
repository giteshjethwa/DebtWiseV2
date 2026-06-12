import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogOut, Moon, Shield, Sun, Trash2, User } from "lucide-react";
import { getProfile, signOut, updateProfile, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const profile = useStore(() => getProfile());
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  if (!profile) return null;

  function toggleDark() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setDark(next);
  }

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Tune DebtWise to match how you work.</p>
      </header>

      {/* Profile */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold text-primary mb-1 inline-flex items-center gap-2">
          <User className="size-4" /> Profile
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Used on your account & notifications.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              defaultValue={profile.name}
              onBlur={(e) => updateProfile({ name: e.target.value })}
              className="set-input"
            />
          </Field>
          <Field label="Email">
            <input
              defaultValue={profile.email}
              onBlur={(e) => updateProfile({ email: e.target.value })}
              type="email"
              className="set-input"
            />
          </Field>
          <Field label="Phone">
            <input
              defaultValue={profile.phone ?? ""}
              onBlur={(e) => updateProfile({ phone: e.target.value })}
              placeholder="+91 ..."
              className="set-input"
            />
          </Field>
          <Field label="Currency">
            <select
              defaultValue={profile.currency}
              onChange={(e) => updateProfile({ currency: e.target.value })}
              className="set-input"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold text-primary mb-1 inline-flex items-center gap-2">
          {dark ? <Moon className="size-4" /> : <Sun className="size-4" />} Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Light or dark — whichever feels calmer.</p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-primary">Dark mode</p>
            <p className="text-xs text-muted-foreground">Easier on the eyes at night.</p>
          </div>
          <button
            onClick={toggleDark}
            className={cn(
              "inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
              dark ? "bg-accent" : "bg-muted",
            )}
            aria-pressed={dark}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full bg-white shadow-card transition-transform",
                dark && "translate-x-5",
              )}
            />
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold text-primary mb-1 inline-flex items-center gap-2">
          <Shield className="size-4" /> Security
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Manage your account access.</p>
        <div className="grid gap-2">
          <button className="text-left rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted transition-colors">
            <p className="text-sm font-semibold text-primary">Change password</p>
            <p className="text-xs text-muted-foreground">Update your sign-in password.</p>
          </button>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/auth" });
            }}
            className="text-left rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-primary">Sign out</p>
              <p className="text-xs text-muted-foreground">You'll need to sign in again.</p>
            </div>
            <LogOut className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete your account and all data? This cannot be undone.")) {
                localStorage.clear();
                navigate({ to: "/auth" });
              }
            }}
            className="text-left rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 hover:bg-destructive/10 transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-destructive">Delete account</p>
              <p className="text-xs text-destructive/80">Permanently remove all your data.</p>
            </div>
            <Trash2 className="size-4 text-destructive" />
          </button>
        </div>
      </section>

      <style>{`
        .set-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-background);
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .set-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 15%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
