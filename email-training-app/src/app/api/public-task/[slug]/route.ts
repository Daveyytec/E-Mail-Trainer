import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Task, TaskPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublicTask(task: Task): TaskPublic {
  return {
    id: task.id,
    title: task.title,
    instructions: task.instructions,
    student_role: task.student_role,
    recipient_role: task.recipient_role,
    recipient_name: task.recipient_name,
    recipient_email: task.recipient_email,
    level: task.level,
    language: task.language,
    max_messages: task.max_messages,
    feedback_enabled: task.feedback_enabled,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Ungueltiger Link." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("public-task fetch error", error);
    return NextResponse.json(
      { error: "Die Aufgabe konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Diese Aufgabe existiert nicht oder ist nicht mehr aktiv." },
      { status: 404 }
    );
  }

  return NextResponse.json({ task: toPublicTask(data as Task) });
}
