import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Seite nicht gefunden</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Diese Aufgabe existiert nicht (mehr) oder ist derzeit nicht aktiv. Bitte
        pruefe den Link oder wende dich an deine Lehrkraft.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Zur Startseite
      </Link>
    </main>
  );
}
