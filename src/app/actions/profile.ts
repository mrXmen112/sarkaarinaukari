"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { bootstrapAdminOrThrow } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import type { SocialCategory } from "@/types/database";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; error?: never }
  | { ok: false; data?: never; error: string };

function err(message: string): ActionResult {
  return { ok: false, error: message };
}

export async function signIn(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return err(error.message);
  const emailAddr = data.user?.email;
  if (emailAddr) await bootstrapAdminOrThrow(data.user.id, emailAddr);
  revalidatePath("/profile");
  redirect("/profile");
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE.url}/auth/callback`,
    },
  });
  if (error) return err(error.message);
  const emailAddr = data.user?.email;
  if (data.user && emailAddr) await bootstrapAdminOrThrow(data.user.id, emailAddr);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/profile");
  redirect("/");
}

export async function upsertProfile(input: {
  full_name?: string;
  age?: number | null;
  education?: string | null;
  category?: SocialCategory | null;
  state?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return err("You must be signed in to save your profile.");

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        full_name: input.full_name ?? null,
        age: input.age ?? null,
        education: input.education ?? null,
        category: input.category ?? null,
        state: input.state ?? null,
      },
      { onConflict: "id" },
    );
  if (error) return err(error.message);
  revalidatePath("/profile");
  return { ok: true };
}

export async function toggleAppliedJob(
  jobId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return err("You must be signed in to track applications.");

  const existing = await supabase
    .from("applied_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("applied_jobs")
      .delete()
      .eq("id", existing.data.id);
    if (error) return err(error.message);
  } else {
    const { error } = await supabase
      .from("applied_jobs")
      .insert({ user_id: user.id, job_id: jobId });
    if (error) return err(error.message);
  }
  revalidatePath("/profile");
  return { ok: true };
}

export async function toggleSavedJob(
  jobId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return err("You must be signed in to save jobs.");

  const existing = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("id", existing.data.id);
    if (error) return err(error.message);
  } else {
    const { error } = await supabase
      .from("saved_jobs")
      .insert({ user_id: user.id, job_id: jobId });
    if (error) return err(error.message);
  }
  revalidatePath("/profile");
  return { ok: true };
}

export async function saveQuizAttempt(input: {
  quizId: string;
  score: number;
  total: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return err("You must be signed in to save your score.");

  const { error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: input.quizId,
      score: input.score,
      total: input.total,
    });
  if (error) return err(error.message);
  revalidatePath("/profile");
  return { ok: true };
}