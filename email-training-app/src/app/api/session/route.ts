import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const slug = parsed.data.slug.trim().toLowerCase();
  const supabase = createAdminClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (taskError) {
    console.error("session task lookup error", taskError);
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  if (!task) {
    return NextResponse.json(
      { error: "Diese Aufgabe existiert nicht oder ist nicht mehr aktiv." },
      { status: 404 }
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({ task_id: task.id })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("session create error", sessionError);
    return NextResponse.json(
      { error: "Die Sitzung konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ session_id: session.id });
}
