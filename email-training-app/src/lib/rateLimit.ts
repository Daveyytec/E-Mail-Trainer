import "server-only";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PER_IP_PER_HOUR = Number(process.env.MAX_REQUESTS_PER_IP_PER_HOUR ?? 30);

/**
 * Liest die Client-IP aus den ueblichen Proxy-Headern (Vercel/Next.js setzt
 * "x-forwarded-for"). Es wird nie die Roh-IP gespeichert, sondern nur ein
 * Hash davon (siehe hashIp), um Datensparsamkeit zu wahren.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "static-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Einfaches, DB-gestuetztes Sliding-Window Rate Limiting.
 * Zaehlt Ereignisse der letzten Stunde pro IP-Hash und lehnt ab, wenn das
 * Limit ueberschritten ist. Reicht fuer eine Unterrichtsanwendung mit
 * moderater Last; fuer sehr hohen Traffic empfiehlt sich ein dedizierter
 * Dienst wie Upstash Ratelimit.
 */
export async function checkAndRecordRateLimit(
  supabase: SupabaseClient,
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if (countError) {
    // Bei einem Zaehlfehler lieber vorsichtig blockieren als offen lassen.
    console.error("rate limit count error", countError);
    return { allowed: false, remaining: 0 };
  }

  const currentCount = count ?? 0;
  if (currentCount >= MAX_PER_IP_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  const { error: insertError } = await supabase
    .from("rate_limit_events")
    .insert({ ip_hash: ipHash });

  if (insertError) {
    console.error("rate limit insert error", insertError);
  }

  return { allowed: true, remaining: MAX_PER_IP_PER_HOUR - currentCount - 1 };
}
