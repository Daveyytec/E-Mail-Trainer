-- =========================================================================
-- E-Mail-Trainer: Datenbankschema fuer Supabase (PostgreSQL)
-- Fuehre dieses Skript im Supabase SQL Editor aus (Projekt -> SQL Editor).
-- =========================================================================

-- Erweiterung fuer UUIDs
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- Tabelle: teachers
-- Verknuepft einen Supabase-Auth-User mit dem Lehrkraft-Bereich.
-- Jede Zeile in "auth.users" darf hoechstens einer Zeile hier entsprechen.
-- -------------------------------------------------------------------------
create table if not exists public.teachers (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Tabelle: tasks
-- Eine von einer Lehrkraft erstellte E-Mail-Schreibaufgabe.
-- -------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,

  title text not null,
  slug text not null unique,

  -- Inhaltliche Konfiguration
  instructions text not null,               -- Aufgabenstellung, die dem Schueler angezeigt wird
  student_role text not null,                -- z.B. "Hotel receptionist"
  recipient_role text not null,              -- z.B. "Hotel guest"
  recipient_name text not null,              -- z.B. "John Smith"
  recipient_email text not null,             -- z.B. "john.smith@example.com"
  background text not null default '',       -- Hintergrundinformationen / Ausgangssituation fuer die KI
  required_points jsonb not null default '[]'::jsonb,      -- string[] Pflichtinhalte
  evaluation_criteria jsonb not null default '[]'::jsonb,  -- string[] Bewertungskriterien

  level text not null default 'B1' check (level in ('A1','A2','B1','B2','C1','C2')),
  language text not null default 'English',

  max_messages integer not null default 6 check (max_messages between 1 and 20),
  feedback_enabled boolean not null default true,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_teacher_id_idx on public.tasks (teacher_id);
create index if not exists tasks_slug_idx on public.tasks (slug);

-- -------------------------------------------------------------------------
-- Tabelle: sessions
-- Eine anonyme Schueler-Sitzung fuer genau eine Aufgabe.
-- Es werden bewusst KEINE personenbezogenen Daten gespeichert.
-- -------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists sessions_task_id_idx on public.sessions (task_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

-- -------------------------------------------------------------------------
-- Tabelle: messages
-- Der E-Mail-Verlauf einer Sitzung (Schueler- und KI-Nachrichten).
-- -------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  role text not null check (role in ('student', 'ai')),
  subject text not null default '',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_id_idx on public.messages (session_id);

-- -------------------------------------------------------------------------
-- Tabelle: feedback
-- Optionales, strukturiertes KI-Feedback zu einer Sitzung.
-- -------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  task_completion integer check (task_completion between 0 and 4),
  language integer check (language between 0 and 4),
  structure integer check (structure between 0 and 4),
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  overall_feedback text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists feedback_session_id_idx on public.feedback (session_id);

-- -------------------------------------------------------------------------
-- Tabelle: rate_limit_events
-- Einfaches, DB-gestuetztes Rate Limiting pro IP-Hash und Zeitfenster.
-- Wir speichern nur einen Hash der IP, keine Klartext-IP.
-- -------------------------------------------------------------------------
create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_ip_hash_idx on public.rate_limit_events (ip_hash, created_at);

-- Alte Rate-Limit-Eintraege regelmaessig loeschen (z.B. per Cron/Edge Function).
-- Hier als Hilfsfunktion, die z.B. taeglich per pg_cron aufgerufen werden kann.
create or replace function public.cleanup_rate_limit_events() returns void as $$
  delete from public.rate_limit_events where created_at < now() - interval '2 days';
$$ language sql security definer;

-- Abgelaufene, anonyme Schuelersitzungen (und damit auch Nachrichten/Feedback
-- via ON DELETE CASCADE) automatisch aufraeumen.
create or replace function public.cleanup_expired_sessions() returns void as $$
  delete from public.sessions where expires_at < now();
$$ language sql security definer;

-- -------------------------------------------------------------------------
-- updated_at automatisch pflegen
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Row Level Security
-- Die Anwendung selbst nutzt fuer Schueler- und KI-Operationen den
-- Service-Role-Key (serverseitig, siehe src/lib/supabase/admin.ts) und damit
-- volle Rechte. RLS schuetzt vor direktem Zugriff ueber den Anon-Key, z.B.
-- falls versehentlich clientseitig auf die Tabellen zugegriffen wird.
-- =========================================================================

alter table public.teachers enable row level security;
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.feedback enable row level security;
alter table public.rate_limit_events enable row level security;

-- teachers: eine Lehrkraft sieht/bearbeitet nur ihre eigene Zeile
drop policy if exists "teachers_self" on public.teachers;
create policy "teachers_self" on public.teachers
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- tasks: eine Lehrkraft sieht/bearbeitet nur ihre eigenen Aufgaben
drop policy if exists "tasks_owner" on public.tasks;
create policy "tasks_owner" on public.tasks
  for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- oeffentliches Lesen aktiver Aufgaben ist NICHT ueber den Anon-Key erlaubt.
-- Der Task-Endpunkt fuer Schueler laeuft ausschliesslich serverseitig
-- (Service-Role-Client), damit z.B. Bewertungskriterien nicht im Klartext
-- an den Browser gehen, bevor sie gebraucht werden.

-- sessions/messages/feedback: kein direkter Client-Zugriff (nur Service Role)
drop policy if exists "no_client_access" on public.sessions;
create policy "no_client_access" on public.sessions for all using (false) with check (false);

drop policy if exists "no_client_access" on public.messages;
create policy "no_client_access" on public.messages for all using (false) with check (false);

drop policy if exists "no_client_access" on public.feedback;
create policy "no_client_access" on public.feedback for all using (false) with check (false);

drop policy if exists "no_client_access" on public.rate_limit_events;
create policy "no_client_access" on public.rate_limit_events for all using (false) with check (false);

-- =========================================================================
-- Hinweis zur Admin-Ersteinrichtung:
-- Nachdem du dich einmal ueber /admin/login (Supabase Auth, "Magic Link"
-- oder E-Mail/Passwort, siehe README) registriert hast, fuege deinen
-- Auth-User als Lehrkraft hinzu, z.B.:
--
--   insert into public.teachers (id, display_name)
--   values ('DEINE-AUTH-USER-UUID', 'Dein Name');
--
-- Die Auth-User-UUID findest du in Supabase unter "Authentication" -> "Users".
-- =========================================================================
