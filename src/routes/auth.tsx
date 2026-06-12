import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { signIn, getSession } from "@/lib/store";
import { Mail, Lock, Phone, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

type Mode = "login" | "signup" | "forgot" | "phone";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (getSession()) navigate({ to: "/dashboard" });
  }, [navigate]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    try {
      if (mode === "phone") {
        if (!otpSent) {
          if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
            setErr("Enter a valid phone number");
            return;
          }
          setOtpSent(true);
          setInfo("OTP sent. Use 123456 to continue.");
          return;
        }
        if (otp !== "123456") {
          setErr("Invalid OTP");
          return;
        }
        signIn(`${phone}@phone.debtwise`, "Gitesh");
        navigate({ to: "/dashboard" });
        return;
      }

      if (mode === "forgot") {
        emailSchema.parse(email);
        setInfo("Reset link sent. Check your inbox.");
        return;
      }

      emailSchema.parse(email);
      if (mode === "signup") {
        if (!name.trim()) {
          setErr("Enter your name");
          return;
        }
        passwordSchema.parse(password);
        if (password !== confirm) {
          setErr("Passwords don't match");
          return;
        }
      } else {
        if (password.length < 1) {
          setErr("Enter your password");
          return;
        }
      }
      signIn(email, mode === "signup" ? name : undefined);
      navigate({ to: "/dashboard" });
    } catch (zerr: any) {
      setErr(zerr?.errors?.[0]?.message ?? "Something went wrong");
    }
  }

  function google() {
    signIn("you@gmail.com", "Gitesh");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 size-80 rounded-full bg-success/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary-foreground text-primary grid place-items-center font-bold">
              D
            </div>
            <span className="text-xl font-bold tracking-tight">DebtWise</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-balance">
            Take control of your debt, one payment at a time.
          </h1>
          <p className="text-primary-foreground/70 text-base max-w-md text-pretty">
            Track every EMI, never miss a due date, and plan the smartest path to financial freedom.
          </p>
          <div className="grid gap-3 pt-4 max-w-md">
            {[
              { icon: ShieldCheck, t: "Bank-grade privacy", s: "Your data stays yours." },
              { icon: Sparkles, t: "Smart strategies", s: "Avalanche & snowball, simulated." },
            ].map(({ icon: Icon, t, s }) => (
              <div
                key={t}
                className="flex items-start gap-3 rounded-xl bg-primary-foreground/5 backdrop-blur p-4 ring-1 ring-primary-foreground/10"
              >
                <div className="size-9 rounded-lg bg-primary-foreground/10 grid place-items-center">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-xs text-primary-foreground/60">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-primary-foreground/50">© 2026 DebtWise</p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">
              D
            </div>
            <span className="text-xl font-bold tracking-tight">DebtWise</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            {mode === "signup"
              ? "Create your account"
              : mode === "forgot"
              ? "Reset your password"
              : mode === "phone"
              ? "Continue with phone"
              : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Start tracking your debt in under a minute."
              : mode === "forgot"
              ? "We'll send a secure reset link to your email."
              : mode === "phone"
              ? otpSent
                ? "Enter the 6-digit code we sent."
                : "We'll send a one-time code to your phone."
              : "Sign in to continue managing your loans."}
          </p>

          {/* Social */}
          {mode !== "forgot" && mode !== "phone" && (
            <div className="mt-6 grid gap-2">
              <button
                onClick={google}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <GoogleMark />
                Continue with Google
              </button>
              <button
                onClick={() => {
                  setMode("phone");
                  setErr(null);
                  setInfo(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Phone className="size-4" /> Continue with Phone
              </button>
              <div className="my-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or {mode === "login" ? "sign in" : "sign up"} with email
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          <form className="space-y-3" onSubmit={submit}>
            {mode === "signup" && (
              <Field label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  placeholder="Gitesh Jethwa"
                  autoComplete="name"
                />
              </Field>
            )}

            {mode === "phone" ? (
              <>
                <Field label="Phone number">
                  <div className="auth-input flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-transparent outline-none"
                      placeholder="+91 98765 43210"
                      inputMode="tel"
                      disabled={otpSent}
                    />
                  </div>
                </Field>
                {otpSent && (
                  <Field label="OTP">
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="auth-input tracking-[0.5em] text-center font-semibold"
                      placeholder="••••••"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </Field>
                )}
              </>
            ) : (
              <Field label="Email">
                <div className="auth-input flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
              </Field>
            )}

            {mode !== "forgot" && mode !== "phone" && (
              <Field label="Password">
                <div className="auth-input flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            )}

            {mode === "signup" && (
              <Field label="Confirm password">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-3.5 rounded border-border"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErr(null);
                  }}
                  className="font-medium text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {err && (
              <div className="text-xs font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            {info && (
              <div className="text-xs font-medium text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
                {info}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
            >
              {mode === "signup"
                ? "Create account"
                : mode === "forgot"
                ? "Send reset link"
                : mode === "phone"
                ? otpSent
                  ? "Verify OTP"
                  : "Send OTP"
                : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                  Sign in
                </button>
              </>
            ) : mode === "forgot" || mode === "phone" ? (
              <>
                <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                  ← Back to sign in
                </button>
              </>
            ) : (
              <>
                New to DebtWise?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      <style>{`
        .auth-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .auth-input:focus, .auth-input:focus-within {
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

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
