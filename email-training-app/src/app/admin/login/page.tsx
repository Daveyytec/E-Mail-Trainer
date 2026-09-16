"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(redirectTo);
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setInfo(
            "Konto erstellt. Falls in Supabase eine E-Mail-Bestaetigung aktiviert ist, bestaetige zuerst dein Konto ueber den Link in der E-Mail und melde dich anschliessend an."
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Anmeldung fehlgeschlagen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm card p-8">
        <h1 className="text-xl font-bold text-slate-900">
          {mode === "login" ? "Lehrkraft-Login" : "Konto erstellen"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Melde dich an, um deine Aufgaben zu verwalten."
            : "Erstelle dein Lehrkraft-Konto fuer diese Anwendung."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {info}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? "Bitte warten..."
              : mode === "login"
              ? "Anmelden"
              : "Konto erstellen"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-sm text-brand-700 hover:underline"
        >
          {mode === "login"
            ? "Noch kein Konto? Jetzt registrieren."
            : "Bereits ein Konto? Jetzt anmelden."}
        </button>
      </div>
    </main>
  );
}
