import type { FeedbackResult } from "@/lib/types";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}/4</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${(value / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function FeedbackPanel({ feedback }: { feedback: FeedbackResult }) {
  return (
    <div className="card space-y-5 border-brand-200 bg-brand-50/40 p-6">
      <h3 className="font-semibold text-slate-900">Dein Feedback</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreBar label="Aufgabenbezug" value={feedback.task_completion} />
        <ScoreBar label="Sprache" value={feedback.language} />
        <ScoreBar label="Aufbau" value={feedback.structure} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-green-700">Staerken</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-700">Verbesserung</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {feedback.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="border-t border-brand-100 pt-4 text-sm text-slate-700">
        {feedback.overall_feedback}
      </p>
    </div>
  );
}
