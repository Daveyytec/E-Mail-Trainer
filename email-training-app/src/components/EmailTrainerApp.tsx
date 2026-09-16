"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedbackResult, Message, TaskPublic } from "@/lib/types";
import EmailThread from "@/components/EmailThread";
import EmailComposer from "@/components/EmailComposer";
import FeedbackPanel from "@/components/FeedbackPanel";

type InitState = "loading" | "ready" | "error";

function randomAddressId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default function EmailTrainerApp({ task }: { task: TaskPublic }) {
  const [initState, setInitState] = useState<InitState>("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const studentAddress = useMemo(
    () => `student-${randomAddressId()}@classroom.local`,
    []
  );

  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    async function init() {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: window.location.pathname.split("/").pop() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sitzung konnte nicht gestartet werden.");
        setSessionId(data.session_id);
        setInitState("ready");
      } catch (err) {
        setInitError(
          err instanceof Error ? err.message : "Sitzung konnte nicht gestartet werden."
        );
        setInitState("error");
      }
    }

    init();
  }, []);

  const limitReached = messageCount >= task.max_messages;

  async function handleSend(subject: string, content: string): Promise<boolean> {
    if (!sessionId) return false;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, subject, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen.");
      setMessages((prev) => [...prev, data.studentMessage, data.aiMessage]);
      setMessageCount(data.messageCount);
      return true;
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Die E-Mail konnte nicht gesendet werden."
      );
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleRequestFeedback() {
    if (!sessionId) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Feedback konnte nicht erstellt werden.");
      setFeedback(data.feedback);
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Feedback konnte nicht erstellt werden."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  if (initState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Aufgabe wird geladen...</p>
      </main>
    );
  }

  if (initState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="card max-w-md p-8 text-center">
          <p className="text-sm text-red-700">{initError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {task.level} · {task.language}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{task.title}</h1>
      </header>

      <section className="card mb-6 p-5">
        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-semibold text-slate-900">Aufgabenstellung</span>
          <span className="text-slate-400">{showInstructions ? "−" : "+"}</span>
        </button>
        {showInstructions && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {task.instructions}
          </p>
        )}
      </section>

      <div className="mb-6">
        <EmailThread
          messages={messages}
          studentAddress={studentAddress}
          recipientName={task.recipient_name}
          recipientEmail={task.recipient_email}
        />
      </div>

      {sendError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {sendError}
        </p>
      )}

      {!limitReached && (
        <EmailComposer
          studentAddress={studentAddress}
          recipientName={task.recipient_name}
          recipientEmail={task.recipient_email}
          disabled={!sessionId}
          sending={sending}
          defaultSubject={messages.length === 0 ? task.title : ""}
          onSend={handleSend}
        />
      )}

      <p className="mt-3 text-center text-xs text-slate-400">
        {messageCount}/{task.max_messages} Nachrichten gesendet
      </p>

      {limitReached && (
        <div className="mt-4 space-y-4">
          <div className="card p-5 text-center text-sm text-slate-600">
            Du hast die maximale Anzahl an Nachrichten fuer diese Uebung erreicht.
          </div>

          {task.feedback_enabled && !feedback && (
            <div className="text-center">
              <button
                onClick={handleRequestFeedback}
                disabled={feedbackLoading}
                className="btn-primary"
              >
                {feedbackLoading ? "Feedback wird erstellt..." : "Feedback anfordern"}
              </button>
              {feedbackError && (
                <p className="mt-2 text-sm text-red-700">{feedbackError}</p>
              )}
            </div>
          )}

          {feedback && <FeedbackPanel feedback={feedback} />}
        </div>
      )}
    </main>
  );
}
