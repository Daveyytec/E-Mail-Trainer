import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestFeedbackSchema } from "@/lib/validation";
import { checkAndRecordRateLimit, getClientIp } from "@/lib/rateLimit";
import { buildFeedbackSystemPrompt } from "@/lib/promptBuilder";
import { callClaude, AnthropicApiError } from "@/lib/anthropic";
import type { Message, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const feedbackResultSchema = z.object({
  task_completion: z.number().int().min(0).max(4),
  language: z.number().int().min(0).max(4),
  structure: z.number().int().min(0).max(4),
  strengths: z.array(z.string()).min(1).max(10),
  improvements: z.array(z.string()).min(1).max(10),
  overall_feedback: z.string().min(1),
});

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Keine JSON-Struktur in der KI-Antwort gefunden.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id fehlt." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("feedback fetch error", error);
    return NextResponse.json(
      { error: "Das Feedback konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ feedback: data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const parsed = requestFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const { session_id } = parsed.data;
  const supabase = createAdminClient();

  const ip = getClientIp(request.headers);
  const rate = await checkAndRecordRateLimit(supabase, ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Es wurden zu viele Anfragen gestellt. Bitte versuche es spaeter erneut." },
      { status: 429 }
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, task_id, tasks(*)")
    .eq("id", session_id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Diese Sitzung ist ungueltig oder abgelaufen." },
      { status: 404 }
    );
  }

  const task = session.tasks as unknown as Task;
  if (!task) {
    return NextResponse.json({ error: "Aufgabe nicht gefunden." }, { status: 404 });
  }

  if (!task.feedback_enabled) {
    return NextResponse.json(
      { error: "Fuer diese Aufgabe ist kein Feedback aktiviert." },
      { status: 403 }
    );
  }

  const { data: history, error: historyError } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session_id)
    .eq("role", "student")
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error("feedback history fetch error", historyError);
    return NextResponse.json(
      { error: "Der Verlauf konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  const studentMessages = history as Message[];
  if (!studentMessages.length) {
    return NextResponse.json(
      { error: "Es wurde noch keine E-Mail geschrieben, die bewertet werden koennte." },
      { status: 400 }
    );
  }

  const combinedText = studentMessages
    .map(
      (m, i) =>
        `E-Mail ${i + 1}\nBetreff: ${m.subject || "(kein Betreff)"}\n${m.content}`
    )
    .join("\n\n---\n\n");

  let rawResult: string;
  try {
    rawResult = await callClaude({
      system: buildFeedbackSystemPrompt(task),
      messages: [{ role: "user", content: combinedText }],
      maxTokens: 800,
      temperature: 0.3,
    });
  } catch (err) {
    console.error("feedback AI error", err);
    const status = err instanceof AnthropicApiError ? 502 : 500;
    return NextResponse.json(
      { error: "Das Feedback konnte gerade nicht erstellt werden. Bitte versuche es erneut." },
      { status }
    );
  }

  let feedbackResult;
  try {
    const json = extractJson(rawResult);
    feedbackResult = feedbackResultSchema.parse(json);
  } catch (err) {
    console.error("feedback parse error", err, rawResult);
    return NextResponse.json(
      { error: "Das Feedback konnte nicht verarbeitet werden. Bitte versuche es erneut." },
      { status: 502 }
    );
  }

  const { data: saved, error: saveError } = await supabase
    .from("feedback")
    .insert({
      session_id,
      task_completion: feedbackResult.task_completion,
      language: feedbackResult.language,
      structure: feedbackResult.structure,
      strengths: feedbackResult.strengths,
      improvements: feedbackResult.improvements,
      overall_feedback: feedbackResult.overall_feedback,
    })
    .select("*")
    .single();

  if (saveError || !saved) {
    console.error("feedback save error", saveError);
    return NextResponse.json(
      { error: "Das Feedback konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ feedback: saved });
}
