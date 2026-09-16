import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        E-Mail-Trainer
      </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Interaktive E-Mail-Schreibuebungen fuer den Sprachunterricht. Schuelerinnen
        und Schueler erhalten von ihrer Lehrkraft einen Link zu einer Aufgabe und
        schreiben dort direkt, ohne Anmeldung, eine E-Mail an einen realistischen
        KI-Empfaenger.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/admin" className="btn-primary">
          Zum Lehrkraftbereich
        </Link>
      </div>
      <p className="mt-10 text-xs text-slate-400">
        <Link href="/privacy" className="underline hover:text-slate-600">
          Datenschutz
        </Link>{" "}
        ·{" "}
        <Link href="/imprint" className="underline hover:text-slate-600">
          Impressum
        </Link>
      </p>
    </main>
  );
}
