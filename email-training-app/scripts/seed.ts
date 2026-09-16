/**
 * Legt die Beispielaufgabe "Hotel Reservation" an, damit der komplette
 * Dialog direkt ausprobiert werden kann.
 *
 * Voraussetzung: Du hast dich bereits einmal ueber /admin/login registriert
 * (siehe README, Abschnitt "Admin-Ersteinrichtung").
 *
 * Aufruf:
 *   npm run seed                     -> nimmt die zuerst gefundene Lehrkraft
 *   npm run seed -- deine@email.de   -> nimmt gezielt diese Lehrkraft
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local setzen."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const emailArg = process.argv[2];
  let teacherId: string | null = null;

  if (emailArg) {
    const { data: userList, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    const match = userList.users.find((u) => u.email === emailArg);
    if (!match) {
      console.error(`Kein Auth-User mit der E-Mail ${emailArg} gefunden.`);
      process.exit(1);
    }
    teacherId = match.id;
    await supabase
      .from("teachers")
      .upsert({ id: teacherId, display_name: match.email }, { onConflict: "id" });
  } else {
    const { data: teachers, error: teachersError } = await supabase
      .from("teachers")
      .select("id")
      .limit(1);
    if (teachersError) throw teachersError;
    if (!teachers?.length) {
      console.error(
        "Keine Lehrkraft gefunden. Registriere dich zuerst unter /admin/login."
      );
      process.exit(1);
    }
    teacherId = teachers[0].id;
  }

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("slug", "hotel-reservation")
    .maybeSingle();

  if (existing) {
    console.log("Die Beispielaufgabe 'hotel-reservation' existiert bereits.");
    return;
  }

  const { error: insertError } = await supabase.from("tasks").insert({
    teacher_id: teacherId,
    title: "Hotel Reservation",
    slug: "hotel-reservation",
    level: "B1",
    language: "English",
    student_role: "Hotel receptionist",
    recipient_role: "Hotel guest",
    recipient_name: "John Smith",
    recipient_email: "john.smith@example.com",
    instructions:
      "You work at a hotel. A guest has sent you an email asking about a double room for three nights.\n\nReply to the guest's email. Your email should include:\n- the price per night\n- whether breakfast is included\n- the check-in time\n- a polite greeting and closing",
    background:
      "Price: 120 EUR per night. Breakfast is included in the price. Check-in is possible from 3:00 pm. The hotel currently has rooms available for the requested dates. Early check-in before 1:00 pm is not possible, but luggage can be stored at the front desk.",
    required_points: [
      "Preis pro Nacht nennen",
      "Angabe zum Fruehstueck",
      "Check-in-Zeit nennen",
      "hoefliche Anrede und Gruszformel",
    ],
    evaluation_criteria: [
      "Alle geforderten Informationen enthalten",
      "Angemessener, hoeflicher Ton fuer eine geschaeftliche E-Mail",
      "Klare Struktur mit Anrede, Hauptteil und Gruszformel",
    ],
    max_messages: 6,
    feedback_enabled: true,
    active: true,
  });

  if (insertError) throw insertError;

  console.log("Beispielaufgabe 'hotel-reservation' wurde erstellt.");
  console.log("Schueler-Link: /task/hotel-reservation");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
