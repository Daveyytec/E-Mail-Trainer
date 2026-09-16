import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-Client mit dem Service-Role-Key. Umgeht Row Level Security komplett.
 *
 * WICHTIG: Dieses Modul importiert "server-only" und darf niemals von
 * Client-Komponenten importiert werden. Er wird ausschliesslich in
 * API-Route-Handlern (src/app/api/**) verwendet, z.B. um anonymen
 * Schuelern ohne eigenen Supabase-Auth-Account das Anlegen von Sitzungen
 * und Nachrichten zu ermoeglichen, und um oeffentliche Aufgaben nach Slug
 * zu laden.
 */
let cachedClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase-Umgebungsvariablen fehlen (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}
