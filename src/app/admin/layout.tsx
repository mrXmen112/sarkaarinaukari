import Link from "next/link";

import { adminSignOut } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/review-queue", label: "Review Queue" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/current-affairs", label: "Current Affairs" },
  { href: "/admin/quizzes", label: "Quizzes" },
  { href: "/admin/yojana", label: "Yojana" },
  { href: "/admin/exams", label: "Exams" },
  { href: "/admin/admit-cards", label: "Admit Cards" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/answer-keys", label: "Answer Keys" },
  { href: "/admin/job-categories", label: "Categories" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
      <aside className="hidden w-48 shrink-0 md:block">
        <nav className="space-y-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Admin
          </p>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-2 py-1.5 text-sm text-navy no-underline hover:bg-paper-muted"
            >
              {item.label}
            </Link>
          ))}
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Public
          </p>
          <Link
            href="/"
            className="block rounded px-2 py-1.5 text-sm text-navy no-underline hover:bg-paper-muted"
          >
            View site
          </Link>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="block w-full rounded px-2 py-1.5 text-left text-sm text-alert hover:bg-paper-muted"
            >
              Sign out
            </button>
          </form>
        </nav>
        {user.email && (
          <p className="mt-6 truncate text-xs text-ink-muted">{user.email}</p>
        )}
      </aside>

      <aside className="flex flex-wrap items-center gap-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded border border-rule px-2 py-1 text-xs text-navy no-underline hover:border-navy"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          className="rounded border border-rule px-2 py-1 text-xs text-navy no-underline hover:border-navy"
        >
          View site
        </Link>
        <form action={adminSignOut}>
          <button
            type="submit"
            className="rounded border border-rule px-2 py-1 text-xs text-alert"
          >
            Sign out
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}