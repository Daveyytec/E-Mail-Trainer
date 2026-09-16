# E-Mail-Trainer
Die Schülerin und Schüler können E-Mails erstellen und versenden. 
# E-Mail-Trainer

Eine interaktive Web-App fuer den Sprachunterricht: Schuelerinnen und Schueler
oeffnen einen Link, schreiben eine E-Mail zu einer vorgegebenen Aufgabe und
erhalten eine realistische Antwort von einer KI, die die Rolle des
E-Mail-Empfaengers spielt - inklusive optionalem, konfigurierbarem Feedback.

Kein Schueler-Account, keine Anmeldung fuer Schuelerinnen und Schueler. Nur die
Lehrkraft loggt sich ein, um Aufgaben zu verwalten.

## Tech-Stack

- **Next.js 14** (App Router) + **TypeScript** + **React 18**
- **Tailwind CSS** fuer das Design
- **Supabase** (Postgres + Auth) als Datenbank und fuer den Lehrkraft-Login
- **Anthropic API (Claude)** fuer den simulierten E-Mail-Empfaenger und das Feedback
- Deployment-Ziel: **Vercel** (funktioniert aber auf jeder Node.js-Plattform)

Alle API-Aufrufe an Supabase (mit Service-Role-Key) und an die Anthropic API
laufen ausschlieszlich serverseitig in Next.js-Route-Handlern
(`src/app/api/**`). Keine Secrets werden an den Browser gesendet.

---

## 1. Voraussetzungen

- Node.js 18.18 oder neuer
- Ein kostenloses [Supabase](https://supabase.com)-Projekt
- Ein [Anthropic](https://console.anthropic.com) API-Key

## 2. Projekt lokal einrichten

```bash
npm install
cp .env.example .env.local
```

Trage in `.env.local` die Werte ein (siehe Abschnitt 3 und 4).

## 3. Supabase einrichten

1. Erstelle ein neues Projekt auf [supabase.com](https://supabase.com).
2. Oeffne im Supabase-Dashboard **SQL Editor** und fuehre den kompletten
   Inhalt von [`supabase/schema.sql`](./supabase/schema.sql) aus. Das legt
   alle Tabellen, Indizes und Row-Level-Security-Regeln an.
3. Gehe zu **Project Settings -> API** und kopiere:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` Key -> `SUPABASE_SERVICE_ROLE_KEY` (**geheim halten!**)
4. Optional, aber empfohlen fuer den Schulbetrieb: Gehe zu
   **Authentication -> Providers -> Email** und entscheide, ob du eine
   E-Mail-Bestaetigung fuer neue Lehrkraft-Konten verlangen willst.

## 4. Anthropic API einrichten

1. Erstelle einen API-Key unter <https://console.anthropic.com/settings/keys>.
2. Trage ihn als `ANTHROPIC_API_KEY` in `.env.local` ein.
3. `ANTHROPIC_MODEL` kann auf ein anderes Modell gesetzt werden, falls
   gewuenscht - pruefe dazu die aktuellen Modell-IDs unter
   <https://docs.claude.com>.

## 5. App lokal starten

```bash
npm run dev
```

Die App laeuft dann unter <http://localhost:3000>.

## 6. Deinen Admin-Account anlegen (Admin-Ersteinrichtung)

1. Oeffne <http://localhost:3000/admin> - du wirst zu `/admin/login`
   weitergeleitet.
2. Klicke auf **"Noch kein Konto? Jetzt registrieren."**, gib deine E-Mail und
   ein Passwort ein und klicke auf **"Konto erstellen"**.
3. Falls du in Supabase eine E-Mail-Bestaetigung aktiviert hast, bestaetige
   dein Konto ueber den Link in der zugesendeten E-Mail und melde dich
   anschlieszend an.
4. **Wichtig fuer den Schulbetrieb:** Deaktiviere danach in Supabase unter
   **Authentication -> Providers -> Email** die Option **"Allow new users to
   sign up"** (bzw. beschraenke Registrierungen z.B. auf eure
   Schul-Domain), damit sich nicht beliebige Personen selbst einen
   Lehrkraft-Zugang anlegen koennen.

Nach der Anmeldung landest du im Lehrkraftbereich (`/admin`) und kannst dort
Aufgaben erstellen.

## 7. Beispielaufgabe anlegen (optional)

Damit du den kompletten Dialog direkt ausprobieren kannst, gibt es ein
Seed-Skript, das die Beispielaufgabe **"Hotel Reservation"** anlegt:

```bash
npm run seed
```

Das Skript nimmt automatisch die zuerst gefundene Lehrkraft. Hast du mehrere
Konten angelegt, kannst du gezielt eines waehlen:

```bash
npm run seed -- deine@email.de
```

Der Schueler-Link lautet danach: `http://localhost:3000/task/hotel-reservation`

## 8. Deine erste eigene Aufgabe erstellen

1. Im Lehrkraftbereich auf **"+ Neue Aufgabe"** klicken.
2. Titel, Aufgabenstellung, Rollen, Hintergrundinformationen und
   Pflichtinhalte ausfuellen. Der Link-Slug wird automatisch aus dem Titel
   generiert, kann aber frei angepasst werden.
3. Optional Bewertungskriterien fuer das Feedback ergaenzen.
4. Auf **"Aufgabe erstellen"** klicken.
5. Auf der Aufgabenliste bei der neuen Aufgabe auf **"Link kopieren"**
   klicken.

## 9. Ersten Schueler-Link verschicken

Der kopierte Link sieht z.B. so aus:

```
https://DEINE-DOMAIN/task/hotel-reservation
```

Diesen Link kannst du direkt an deine Klasse schicken (z.B. per Messenger,
Lernplattform oder QR-Code). Schuelerinnen und Schueler benoetigen keine
Anmeldung.

---

## Deployment auf Vercel

1. Repository zu GitHub/GitLab pushen und in [Vercel](https://vercel.com)
   importieren (oder `vercel` CLI nutzen).
2. Unter **Project Settings -> Environment Variables** alle Variablen aus
   `.env.example` eintragen (mit deinen echten Werten). Die Variable
   `NEXT_PUBLIC_APP_URL` auf deine spaetere Produktions-URL setzen.
3. Deployen. Next.js API-Routen laufen automatisch als Vercel Functions.
4. Danach einmalig `npm run seed` **lokal** gegen die Produktions-Supabase-
   Instanz ausfuehren (mit den Produktions-Env-Variablen in `.env.local`),
   falls du die Beispielaufgabe auch dort haben moechtest - oder einfach
   direkt im Admin-Bereich der deployten App eine Aufgabe anlegen.

Andere Node.js-faehige Plattformen (Render, Railway, eigener Server mit
`npm run build && npm run start`) funktionieren ebenso.

---

## Sicherheit & Kostenkontrolle

- **Keine Secrets im Client**: `SUPABASE_SERVICE_ROLE_KEY` und
  `ANTHROPIC_API_KEY` werden ausschlieszlich serverseitig gelesen.
- **Rate Limiting**: Jede KI-Anfrage (E-Mail-Antwort und Feedback) wird pro
  IP-Adresse gezaehlt (`rate_limit_events`-Tabelle, Standard: 30/Stunde,
  konfigurierbar ueber `MAX_REQUESTS_PER_IP_PER_HOUR`). Es wird nur ein Hash
  der IP gespeichert, keine Klartext-IP.
- **Nachrichtenlimits pro Aufgabe**: `max_messages` pro Aufgabe konfigurierbar
  (Lehrkraft-Formular), zusaetzlich globales Sitzungslimit
  `MAX_REQUESTS_PER_SESSION`.
- **Maximale Textlaenge**: `MAX_MESSAGE_LENGTH` (Standard 3000 Zeichen),
  serverseitig validiert (zod), nicht nur im Frontend.
- **Prompt-Injection-Schutz**: Der Systemprompt weist die KI explizit an,
  eingehende Nachrichten nie als Anweisungen zu behandeln, keine Systemprompts
  offenzulegen und im Szenario zu bleiben (siehe
  `src/lib/promptBuilder.ts`). Kein Schutz ist 100% wirksam - bei
  produktivem Einsatz empfiehlt sich zusaetzliches Monitoring der
  KI-Antworten.
- **Datensparsamkeit**: Schueler-Sitzungen sind komplett anonym (keine Namen,
  keine Schueler-E-Mail-Adressen), laufen nach 7 Tagen ab
  (`sessions.expires_at`) und koennen automatisch geloescht werden.
- **Aufraeumen ablaufender Daten**: Die Funktionen
  `cleanup_expired_sessions()` und `cleanup_rate_limit_events()` in
  `supabase/schema.sql` koennen per **Supabase Cron** (Dashboard ->
  Database -> Cron Jobs) taeglich geplant werden, z.B.:
  ```sql
  select cron.schedule('cleanup-sessions', '0 3 * * *', 'select public.cleanup_expired_sessions();');
  select cron.schedule('cleanup-rate-limit', '0 3 * * *', 'select public.cleanup_rate_limit_events();');
  ```
  (Erfordert die `pg_cron`-Extension, in Supabase unter **Database ->
  Extensions** aktivierbar.)
- **Row Level Security**: Aktiviert fuer alle Tabellen. Lehrkraefte sehen und
  bearbeiten ausschlieszlich ihre eigenen Aufgaben. Schueler-/KI-Operationen
  laufen ueber den Service-Role-Key server-seitig und umgehen RLS bewusst
  (z.B. um eine Aufgabe per Slug zu laden), sind aber durch die API-Routen
  selbst auf die dort vorgesehenen, sicheren Operationen beschraenkt.

## Bekannte Grenzen / was du fuer echten Produktivbetrieb noch ergaenzen solltest

- Das Rate Limiting ist datenbankgestuetzt und robust genug fuer den
  Schulbetrieb, aber nicht so performant wie ein dedizierter Dienst
  (z.B. Upstash Ratelimit + Redis) bei sehr hoher gleichzeitiger Last.
- Es gibt aktuell keine automatische E-Mail-Benachrichtigung an die Lehrkraft;
  Feedback wird nur der/dem Schueler direkt angezeigt.
- Fuer eine schulweite Nutzung mit vielen Lehrkraeften kann es sinnvoll sein,
  Supabase Auth um eine Schul-Domain-Beschraenkung oder SSO zu erweitern.

## Projektstruktur

```
src/
  app/
    page.tsx                     Startseite
    privacy/, imprint/           Platzhalter-Rechtsseiten
    task/[slug]/page.tsx         Oeffentliche Schueler-Aufgabenseite
    admin/                       Geschuetzter Lehrkraftbereich
      login/page.tsx
      page.tsx                   Aufgabenliste
      tasks/new/page.tsx
      tasks/[id]/edit/page.tsx
    api/
      public-task/[slug]/route.ts
      session/route.ts           Anonyme Sitzung anlegen
      messages/route.ts          E-Mail senden -> KI-Antwort
      feedback/route.ts          Feedback anfordern
      tasks/route.ts             Aufgaben-CRUD (Lehrkraft, GET/POST)
      tasks/[id]/route.ts        Aufgaben-CRUD (Lehrkraft, GET/PUT/DELETE)
  components/                    UI-Komponenten (Composer, Thread, Feedback, Formulare)
  lib/
    supabase/                    Browser-, Server- und Admin-Clients
    anthropic.ts                 Anthropic-API-Wrapper
    promptBuilder.ts             System-Prompts fuer Empfaenger- und Feedback-KI
    rateLimit.ts, validation.ts, types.ts
  middleware.ts                  Schuetzt /admin, refresht Auth-Session
supabase/schema.sql              Vollstaendiges Datenbankschema inkl. RLS
scripts/seed.ts                  Legt Beispielaufgabe an
```
