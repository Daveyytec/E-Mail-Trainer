export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">Datenschutzerklaerung</h1>
      <p className="mt-4 text-sm text-slate-600">
        Dies ist eine Platzhalterseite. Bitte passe sie an dein Bundesland, deine
        Schule bzw. deinen Traeger an, bevor du die Anwendung produktiv einsetzt.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-semibold text-slate-900">1. Verantwortliche Stelle</h2>
          <p>[Name der Schule / Lehrkraft, Anschrift, Kontakt einfuegen]</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">2. Verarbeitete Daten</h2>
          <p>
            Schuelerinnen und Schueler nutzen diese Anwendung ohne Benutzerkonto und
            ohne Angabe von Namen oder E-Mail-Adresse. Gespeichert werden lediglich
            eine zufaellige, anonyme Sitzungs-ID sowie der Text der im Rahmen der
            Uebung geschriebenen E-Mails, damit der Dialogverlauf angezeigt und der
            Lernfortschritt ausgewertet werden kann. Sitzungen laufen automatisch
            nach einer festgelegten Frist ab und werden geloescht.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">3. KI-Verarbeitung</h2>
          <p>
            Die eingegebenen Texte werden zur Erzeugung der simulierten Antwort und
            des Feedbacks an einen externen KI-Dienst (Anthropic, Claude API)
            uebermittelt. [Hier ggf. Angaben zu Auftragsverarbeitung/Serverstandort
            gemaess den Vorgaben deiner Schule/Aufsichtsbehoerde ergaenzen.]
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">4. Verantwortliche Lehrkraft</h2>
          <p>
            Lehrkraefte benoetigen ein Konto, um Aufgaben zu erstellen und zu
            verwalten. Es werden E-Mail-Adresse und Authentifizierungsdaten ueber
            den Auth-Anbieter (Supabase) gespeichert.
          </p>
        </section>
      </div>
    </main>
  );
}
