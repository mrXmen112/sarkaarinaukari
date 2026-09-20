import Link from "next/link";
import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { signOut } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/date";
import type { Job, Quiz } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Dashboard — SarkaariNaukri.online",
  description:
    "Manage your profile, track applied and saved government jobs, and review your quiz scores.",
  alternates: { canonical: "/profile" },
};

type JobEmbed = Pick<Job, "id" | "title" | "slug">;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const [{ data: profile }, { data: applied }, { data: saved }, { data: attempts }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("applied_jobs")
        .select("id, applied_on, status, job_id, jobs(id, title, slug)")
        .order("applied_on", { ascending: false }),
      supabase
        .from("saved_jobs")
        .select("id, created_at, job_id, jobs(id, title, slug)")
        .order("created_at", { ascending: false }),
      supabase
        .from("quiz_attempts")
        .select("id, score, total, attempted_at, quizzes(id, title, slug)")
        .order("attempted_at", { ascending: false })
        .limit(10),
    ]);

  const appliedJobs = (applied ?? []).map((a) => ({
    ...a,
    job: a.jobs as unknown as JobEmbed | null,
  }));
  const savedJobs = (saved ?? []).map((s) => ({
    ...s,
    job: s.jobs as unknown as JobEmbed | null,
  }));
  const quizAttempts = (attempts ?? []).map((a) => ({
    ...a,
    quiz: a.quizzes as unknown as Pick<Quiz, "id" | "title" | "slug"> | null,
  }));

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "My Dashboard", path: "/profile" }])}
      />
      <Breadcrumbs items={[{ label: "My Dashboard" }]} />

      <PageHeader
        title={`Hello, ${profile?.full_name ?? user.email?.split("@")[0] ?? "User"}`}
        subtitle="Track your applications, bookmark jobs, and keep your preparation details updated."
        meta={user.email ?? undefined}
      />

      <ProfileForm profile={profile} />

      <Panel title="Applied Jobs" className="mb-4">
        {appliedJobs.length === 0 ? (
          <p className="text-sm text-ink-muted">
            You haven&apos;t marked any applications yet. Open a job and tap
            &ldquo;Applied&rdquo; to track it here.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {appliedJobs.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={a.job ? `/jobs/${a.job.slug}` : "#"}
                  className="text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {a.job?.title ?? "Job"}
                </Link>
                <span className="whitespace-nowrap text-xs text-ink-muted">
                  {formatDate(a.applied_on)} • {a.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Saved Jobs" className="mb-4">
        {savedJobs.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No saved jobs yet. Tap the save/bookmark option on any job to add it
            here.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {savedJobs.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={s.job ? `/jobs/${s.job.slug}` : "#"}
                  className="text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {s.job?.title ?? "Job"}
                </Link>
                <span className="whitespace-nowrap text-xs text-ink-muted">
                  Saved {formatDate(s.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Quiz Scores" className="mb-4">
        {quizAttempts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No quiz scores yet. Take a quiz and sign in to save your attempts.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {quizAttempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={a.quiz ? `/quiz/${a.quiz.slug}` : "#"}
                  className="text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {a.quiz?.title ?? "Quiz"}
                </Link>
                <span className="whitespace-nowrap text-xs text-ink-muted">
                  {a.score}/{a.total} • {formatDate(a.attempted_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded border border-rule px-4 py-2 text-sm font-semibold"
        >
          Sign Out
        </button>
      </form>
    </PageContainer>
  );
}