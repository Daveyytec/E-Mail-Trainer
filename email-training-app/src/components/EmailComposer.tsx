"use client";

import { useState, type FormEvent } from "react";

const MAX_LENGTH = 3000;

export default function EmailComposer({
  studentAddress,
  recipientName,
  recipientEmail,
  disabled,
  sending,
  defaultSubject,
  onSend,
}: {
  studentAddress: string;
  recipientName: string;
  recipientEmail: string;
  disabled: boolean;
  sending: boolean;
  defaultSubject: string;
  onSend: (subject: string, content: string) => Promise<boolean>;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [content, setContent] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending || disabled) return;
    const success = await onSend(subject, content);
    if (success) {
      setContent("");
    }
    // Bei einem Fehler bleibt der Text erhalten, damit nichts verloren geht.
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-5">
      <div className="grid gap-2 border-b border-slate-100 pb-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-slate-400">Von:</span>
          <span className="text-slate-600">{studentAddress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-slate-400">An:</span>
          <span className="text-slate-600">
            {recipientName} &lt;{recipientEmail}&gt;
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-slate-400">Betreff:</span>
          <input
            className="flex-1 border-none bg-transparent p-0 text-sm text-slate-800 focus:outline-none focus:ring-0"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Betreff"
            disabled={disabled}
          />
        </div>
      </div>

      <textarea
        rows={8}
        className="field-input resize-y"
        placeholder="Schreibe hier deine E-Mail..."
        value={content}
        maxLength={MAX_LENGTH}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {content.length}/{MAX_LENGTH} Zeichen
        </span>
        <button
          type="submit"
          disabled={disabled || sending || !content.trim()}
          className="btn-primary"
        >
          {sending ? "Wird gesendet..." : "E-Mail senden"}
        </button>
      </div>
    </form>
  );
}
