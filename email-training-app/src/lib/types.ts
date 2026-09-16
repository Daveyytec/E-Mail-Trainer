export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Task {
  id: string;
  teacher_id: string;
  title: string;
  slug: string;
  instructions: string;
  student_role: string;
  recipient_role: string;
  recipient_name: string;
  recipient_email: string;
  background: string;
  required_points: string[];
  evaluation_criteria: string[];
  level: Level;
  language: string;
  max_messages: number;
  feedback_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Omit<
  Task,
  "id" | "teacher_id" | "created_at" | "updated_at"
>;

export interface TaskPublic {
  id: string;
  title: string;
  instructions: string;
  student_role: string;
  recipient_role: string;
  recipient_name: string;
  recipient_email: string;
  level: Level;
  language: string;
  max_messages: number;
  feedback_enabled: boolean;
}

export type MessageRole = "student" | "ai";

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  subject: string;
  content: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  session_id: string;
  task_completion: number;
  language: number;
  structure: number;
  strengths: string[];
  improvements: string[];
  overall_feedback: string;
  created_at: string;
}

export interface FeedbackResult {
  task_completion: number;
  language: number;
  structure: number;
  strengths: string[];
  improvements: string[];
  overall_feedback: string;
}
