import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TaskList from "@/components/TaskList";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deine Aufgaben</h1>
          <p className="mt-1 text-sm text-slate-500">
            Erstelle E-Mail-Schreibaufgaben und teile die jeweiligen Links mit
            deiner Klasse.
          </p>
        </div>
        <Link href="/admin/tasks/new" className="btn-primary">
          + Neue Aufgabe
        </Link>
      </div>

      <div className="mt-8">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Aufgaben konnten nicht geladen werden.
          </p>
        )}
        <TaskList initialTasks={(tasks as Task[]) ?? []} />
      </div>
    </div>
  );
}
