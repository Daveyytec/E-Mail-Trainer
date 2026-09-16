import TaskForm from "@/components/TaskForm";

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Neue Aufgabe</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fuelle die Felder aus, um eine neue E-Mail-Schreibaufgabe zu erstellen.
      </p>
      <div className="mt-6">
        <TaskForm />
      </div>
    </div>
  );
}
