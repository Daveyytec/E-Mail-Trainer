import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TaskForm from "@/components/TaskForm";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!task) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Aufgabe bearbeiten</h1>
      <p className="mt-1 text-sm text-slate-500">/task/{(task as Task).slug}</p>
      <div className="mt-6">
        <TaskForm task={task as Task} />
      </div>
    </div>
  );
}
