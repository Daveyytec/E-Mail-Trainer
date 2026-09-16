import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Client fuer Server Components und Route Handler.
 * Laeuft im Kontext der eingeloggten Lehrkraft (nutzt die Auth-Cookies) und
 * unterliegt damit den Row-Level-Security-Regeln aus supabase/schema.sql.
 * Fuer Aufgaben-CRUD durch die Lehrkraft ist das der richtige Client.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In Server Components ohne Response-Objekt kann set() ignoriert
            // werden - das Middleware-Refresh uebernimmt das Setzen.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // siehe oben
          }
        },
      },
    }
  );
}
