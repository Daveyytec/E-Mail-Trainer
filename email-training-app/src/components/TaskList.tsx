"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/types";

function taskLink(slug: string): string {
  if (typeof window === "undefined") return `/task/${slug}`;
  return `${window.location.origin}/task/${slug}`;
}

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copyLink(task: Task) {
    try {
      await navigator.clipboard.writeText(taskLink(task.slug));
      setCopiedId(task.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Der Link konnte nicht in die Zwischenablage kopiert werden.");
    }
  }

  async function toggleActive(task: Task) {
    setBusyId(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !task.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, active: data.task.active } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateTask(task: Task) {
    setBusyId(task.id);
    setError(null);
    try {
      let newSlug = `${task.slug}-kopie`;
      let suffix = 2;
      while (tasks.some((t) => t.slug === newSlug)) {
        newSlug = `${task.slug}-kopie-${suffix}`;
        suffix += 1;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${task.title} (Kopie)`,
          slug: newSlug,
          instructions: task.instructions,
          student_role: task.student_role,
          recipient_role: task.recipient_role,
          recipient_name: task.recipient_name,
          recipient_email: task.recipient_email,
          background: task.background,
          required_points: task.required_points,
          evaluation_criteria: task.evaluation_criteria,
          level: task.level,
          language: task.language,
          max_messages: task.max_messages,
          feedback_enabled: task.feedback_enabled,
          active: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
      setTasks((prev) => [data.task, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task: Task) {
    if (!confirm(`Aufgabe "${task.title}" wirklich unwiderruflich loeschen?`)) {
      return;
    }
    setBusyId(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusyId(null);
      router.refresh();
    }
  }

  if (!tasks.length) {
    return (
      <div className="card p-10 text-center text-sm text-slate-500">
        Du hast noch keine Aufgaben erstellt.{" "}
        <Link href="/admin/tasks/new" className="text-brand-700 underline">
          Jetzt die erste Aufgabe anlegen
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {tasks.map((task) => (
        <div key={task.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-slate-900">{task.title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {task.level}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  task.active
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {task.active ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">/task/{task.slug}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyLink(task)}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              {copiedId === task.id ? "Kopiert!" : "Link kopieren"}
            </button>
            <Link
              href={`/admin/tasks/${task.id}/edit`}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Bearbeiten
            </Link>
            <button
              onClick={() => toggleActive(task)}
              disabled={busyId === task.id}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              {task.active ? "Deaktivieren" : "Aktivieren"}
            </button>
            <button
              onClick={() => duplicateTask(task)}
              disabled={busyId === task.id}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Kopieren
            </button>
            <button
              onClick={() => deleteTask(task)}
              disabled={busyId === task.id}
              className="btn-danger !py-1.5 !px-3 text-xs"
            >
              Loeschen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
