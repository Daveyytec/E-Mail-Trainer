import type { Message } from "@/lib/types";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function EmailThread({
  messages,
  studentAddress,
  recipientName,
  recipientEmail,
}: {
  messages: Message[];
  studentAddress: string;
  recipientName: string;
  recipientEmail: string;
}) {
  if (!messages.length) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        Noch keine Nachrichten. Schreibe unten deine erste E-Mail.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isStudent = message.role === "student";
        return (
          <div
            key={message.id}
            className={`card p-5 ${isStudent ? "border-brand-200" : "border-slate-200"}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
              <div>
                <span className="font-medium text-slate-700">
                  {isStudent ? "Du" : recipientName}
                </span>{" "}
                &lt;{isStudent ? studentAddress : recipientEmail}&gt;
              </div>
              <span>{formatTime(message.created_at)}</span>
            </div>
            {message.subject && (
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {message.subject}
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {message.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
