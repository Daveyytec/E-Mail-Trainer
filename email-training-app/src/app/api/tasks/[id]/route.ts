import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { taskInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("task fetch error", error);
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Aufgabe nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const parsed = taskInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Ungueltige Eingabe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("task update error", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Dieser Link-Slug wird bereits verwendet. Bitte waehle einen anderen." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Aufgabe nicht gefunden oder keine Berechtigung." },
      { status: 404 }
    );
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { error } = await supabase.from("tasks").delete().eq("id", params.id);

  if (error) {
    console.error("task delete error", error);
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht geloescht werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
