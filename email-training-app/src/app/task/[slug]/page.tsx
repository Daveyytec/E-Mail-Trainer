import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import EmailTrainerApp from "@/components/EmailTrainerApp";
import type { Task, TaskPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublicTask(task: Task): TaskPublic {
  return {
    id: task.id,
    title: task.title,
    instructions: task.instructions,
    student_role: task.student_role,
    recipient_role: task.recipient_role,
    recipient_name: task.recipient_name,
    recipient_email: task.recipient_email,
    level: task.level,
    language: task.language,
    max_messages: task.max_messages,
    feedback_enabled: task.feedback_enabled,
  };
}

export default async function StudentTaskPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("slug", params.slug.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return <EmailTrainerApp task={toPublicTask(data as Task)} />;
}
