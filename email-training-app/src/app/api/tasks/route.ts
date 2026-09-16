import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { taskInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("tasks list error", error);
    return NextResponse.json(
      { error: "Aufgaben konnten nicht geladen werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ tasks: data });
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const parsed = taskInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Ungueltige Eingabe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Sicherstellen, dass fuer diese Lehrkraft ein Eintrag in "teachers" existiert
  // (wird u.a. von der Row-Level-Security-Policy fuer "tasks" benoetigt).
  await supabase
    .from("teachers")
    .upsert({ id: user.id, display_name: user.email }, { onConflict: "id" });

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...parsed.data, teacher_id: user.id })
    .select("*")
    .single();

  if (error) {
    console.error("task create error", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Dieser Link-Slug wird bereits verwendet. Bitte waehle einen anderen." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ task: data }, { status: 201 });
}
