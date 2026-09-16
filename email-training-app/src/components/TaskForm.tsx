"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Level, Task, TaskInput } from "@/lib/types";

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type ListFieldProps = {
  label: string;
  helpText: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
};

function ListField({ label, helpText, values, onChange, placeholder }: ListFieldProps) {
  function update(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...values, ""]);
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <p className="mb-2 text-xs text-slate-500">{helpText}</p>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="field-input"
              value={value}
              placeholder={placeholder}
              onChange={(e) => update(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="btn-secondary !px-3"
              aria-label="Entfernen"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-sm text-brand-700 hover:underline">
        + Punkt hinzufuegen
      </button>
    </div>
  );
}

export default function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const isEdit = Boolean(task);

  const [title, setTitle] = useState(task?.title ?? "");
  const [slug, setSlug] = useState(task?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [instructions, setInstructions] = useState(task?.instructions ?? "");
  const [level, setLevel] = useState<Level>(task?.level ?? "B1");
  const [language, setLanguage] = useState(task?.language ?? "English");
  const [studentRole, setStudentRole] = useState(task?.student_role ?? "");
  const [recipientRole, setRecipientRole] = useState(task?.recipient_role ?? "");
  const [recipientName, setRecipientName] = useState(task?.recipient_name ?? "");
  const [recipientEmail, setRecipientEmail] = useState(task?.recipient_email ?? "");
  const [background, setBackground] = useState(task?.background ?? "");
  const [requiredPoints, setRequiredPoints] = useState<string[]>(
    task?.required_points?.length ? task.required_points : [""]
  );
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>(
    task?.evaluation_criteria?.length ? task.evaluation_criteria : [""]
  );
  const [maxMessages, setMaxMessages] = useState(task?.max_messages ?? 6);
  const [feedbackEnabled, setFeedbackEnabled] = useState(task?.feedback_enabled ?? true);
  const [active, setActive] = useState(task?.active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: TaskInput = {
      title: title.trim(),
      slug: slugify(slug),
      instructions: instructions.trim(),
      student_role: studentRole.trim(),
      recipient_role: recipientRole.trim(),
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.trim(),
      background: background.trim(),
      required_points: requiredPoints.map((p) => p.trim()).filter(Boolean),
      evaluation_criteria: evaluationCriteria.map((c) => c.trim()).filter(Boolean),
      level,
      language: language.trim(),
      max_messages: maxMessages,
      feedback_enabled: feedbackEnabled,
      active,
    };

    try {
      const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
        method: isEdit ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Grunddaten</h2>

        <div>
          <label className="field-label" htmlFor="title">
            Titel
          </label>
          <input
            id="title"
            required
            className="field-input"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="z.B. Hotel Reservation"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="slug">
            Link-Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">/task/</span>
            <input
              id="slug"
              required
              className="field-input"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="hotel-reservation"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Nur Kleinbuchstaben, Zahlen und Bindestriche. Ergibt den Link, den du an
            die Klasse verschickst.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="level">
              Sprachniveau
            </label>
            <select
              id="level"
              className="field-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="language">
              Sprache
            </label>
            <input
              id="language"
              required
              className="field-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Aufgabenstellung fuer den Schueler</h2>
        <div>
          <label className="field-label" htmlFor="instructions">
            Aufgabenstellung
          </label>
          <textarea
            id="instructions"
            required
            rows={5}
            className="field-input"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="You work at a hotel. A guest has sent you an email asking about a double room for three nights. Reply to the guest..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="studentRole">
              Rolle des Schuelers
            </label>
            <input
              id="studentRole"
              required
              className="field-input"
              value={studentRole}
              onChange={(e) => setStudentRole(e.target.value)}
              placeholder="Hotel receptionist"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="recipientRole">
              Rolle des Empfaengers (KI)
            </label>
            <input
              id="recipientRole"
              required
              className="field-input"
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value)}
              placeholder="Hotel guest"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="recipientName">
              Name des Empfaengers
            </label>
            <input
              id="recipientName"
              required
              className="field-input"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="recipientEmail">
              E-Mail-Adresse des Empfaengers
            </label>
            <input
              id="recipientEmail"
              type="email"
              required
              className="field-input"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="john.smith@example.com"
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Fuer die KI (nicht fuer den Schueler sichtbar)</h2>
        <div>
          <label className="field-label" htmlFor="background">
            Hintergrundinformationen / Ausgangssituation
          </label>
          <textarea
            id="background"
            rows={4}
            className="field-input"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Preis: 120 EUR/Nacht, Fruehstueck inklusive, Check-in ab 15 Uhr, 12 Zimmer verfuegbar..."
          />
        </div>

        <ListField
          label="Was muss in der E-Mail vorkommen? (Pflichtinhalte)"
          helpText="Diese Punkte fliessen sowohl in die KI-Antwort als auch ins Feedback ein."
          values={requiredPoints}
          onChange={setRequiredPoints}
          placeholder="z.B. Preis pro Nacht nennen"
        />

        <ListField
          label="Bewertungskriterien fuer das Feedback"
          helpText="Optional. Wenn leer, bewertet die KI allgemein nach Aufgabenbezug, Sprache und Aufbau."
          values={evaluationCriteria}
          onChange={setEvaluationCriteria}
          placeholder="z.B. korrekte Anrede und Gruszformel"
        />
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">Einstellungen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="maxMessages">
              Maximale Anzahl Nachrichten pro Schueler
            </label>
            <input
              id="maxMessages"
              type="number"
              min={1}
              max={20}
              required
              className="field-input"
              value={maxMessages}
              onChange={(e) => setMaxMessages(Number(e.target.value))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={feedbackEnabled}
            onChange={(e) => setFeedbackEnabled(e.target.checked)}
          />
          Feedback-Funktion aktivieren
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Aufgabe aktiv (Link fuer Schueler erreichbar)
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Speichert..." : isEdit ? "Aenderungen speichern" : "Aufgabe erstellen"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/admin")}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
