import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessageSchema } from "@/lib/validation";
import { checkAndRecordRateLimit, getClientIp } from "@/lib/rateLimit";
import { buildRecipientSystemPrompt } from "@/lib/promptBuilder";
import { callClaude, AnthropicApiError, type AnthropicMessage } from "@/lib/anthropic";
import type { Message, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_REQUESTS_PER_SESSION = Number(process.env.MAX_REQUESTS_PER_SESSION ?? 40);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id fehlt." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("messages fetch error", error);
    return NextResponse.json(
      { error: "Der Verlauf konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: data as Message[] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Ungueltige Eingabe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { session_id, subject, content } = parsed.data;
  const supabase = createAdminClient();

  // Rate Limiting pro IP
  const ip = getClientIp(request.headers);
  const rate = await checkAndRecordRateLimit(supabase, ip);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Es wurden in kurzer Zeit zu viele Anfragen gestellt. Bitte versuche es in etwas spaeter erneut.",
      },
      { status: 429 }
    );
  }

  // Session + zugehoerige Aufgabe laden
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, task_id, message_count, expires_at, tasks(*)")
    .eq("id", session_id)
    .maybeSingle();

  if (sessionError) {
    console.error("session lookup error", sessionError);
    return NextResponse.json(
      { error: "Die Sitzung konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  if (!session) {
    return NextResponse.json(
      { error: "Diese Sitzung ist ungueltig oder abgelaufen. Bitte lade die Seite neu." },
      { status: 404 }
    );
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Diese Sitzung ist abgelaufen. Bitte lade die Seite neu." },
      { status: 410 }
    );
  }

  const task = session.tasks as unknown as Task;
  if (!task) {
    return NextResponse.json(
      { error: "Die zugehoerige Aufgabe wurde nicht gefunden." },
      { status: 404 }
    );
  }

  if (session.message_count >= task.max_messages) {
    return NextResponse.json(
      {
        error:
          "Die maximale Anzahl an Nachrichten fuer diese Uebung ist erreicht. Du kannst jetzt dein Feedback anfordern.",
      },
      { status: 403 }
    );
  }

  if (session.message_count >= MAX_REQUESTS_PER_SESSION) {
    return NextResponse.json(
      { error: "Das Anfragelimit fuer diese Sitzung ist erreicht." },
      { status: 403 }
    );
  }

  // Bisherigen Verlauf laden (fuer Kontext der KI)
  const { data: history, error: historyError } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error("history fetch error", historyError);
    return NextResponse.json(
      { error: "Der Verlauf konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  // Neue Schueler-Nachricht speichern
  const { data: studentMessage, error: insertStudentError } = await supabase
    .from("messages")
    .insert({
      session_id,
      role: "student",
      subject,
      content,
    })
    .select("*")
    .single();

  if (insertStudentError || !studentMessage) {
    console.error("insert student message error", insertStudentError);
    return NextResponse.json(
      { error: "Deine E-Mail konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  // Verlauf inkl. neuer Nachricht fuer die KI aufbereiten
  const anthropicMessages: AnthropicMessage[] = [
    ...(history as Message[]).map((m) => ({
      role: (m.role === "student" ? "user" : "assistant") as "user" | "assistant",
      content: `Betreff: ${m.subject || "(kein Betreff)"}\n\n${m.content}`,
    })),
    {
      role: "user",
      content: `Betreff: ${subject || "(kein Betreff)"}\n\n${content}`,
    },
  ];

  let aiReply: string;
  try {
    aiReply = await callClaude({
      system: buildRecipientSystemPrompt(task),
      messages: anthropicMessages,
      maxTokens: 700,
      temperature: 0.8,
    });
  } catch (err) {
    console.error("AI reply error", err);
    const status = err instanceof AnthropicApiError ? 502 : 500;
    return NextResponse.json(
      {
        error:
          "Die Antwort konnte gerade nicht erstellt werden. Bitte versuche es in einigen Sekunden erneut. Deine E-Mail wurde gespeichert und geht nicht verloren.",
        studentMessage,
      },
      { status }
    );
  }

  const replySubject = subject
    ? subject.toLowerCase().startsWith("re:")
      ? subject
      : `Re: ${subject}`
    : `Re: ${task.title}`;

  const { data: aiMessage, error: insertAiError } = await supabase
    .from("messages")
    .insert({
      session_id,
      role: "ai",
      subject: replySubject,
      content: aiReply,
    })
    .select("*")
    .single();

  if (insertAiError || !aiMessage) {
    console.error("insert ai message error", insertAiError);
    return NextResponse.json(
      { error: "Die Antwort konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  const { error: updateSessionError } = await supabase
    .from("sessions")
    .update({ message_count: session.message_count + 1 })
    .eq("id", session_id);

  if (updateSessionError) {
    console.error("update session count error", updateSessionError);
  }

  return NextResponse.json({
    studentMessage,
    aiMessage,
    messageCount: session.message_count + 1,
    maxMessages: task.max_messages,
  });
}
