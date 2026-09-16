"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Client fuer den Browser. Nutzt ausschliesslich den oeffentlichen
 * Anon-Key. Verwende diesen Client NIE fuer sicherheitskritische Operationen -
 * dafuer gibt es die serverseitigen Clients in server.ts und admin.ts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
