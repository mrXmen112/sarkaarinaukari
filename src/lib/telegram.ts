import { formatDate } from "@/lib/date";

/**
 * Telegram auto-post (Phase 1): fires when an admin approves a job in the
 * review queue AND the telegram_auto_post setting is on. Token + chat id come
 * from env vars; the on/off toggle lives in site_settings.
 *
 * Any failure (missing config, bot blocked, network) is logged and swallowed —
 * publishing must never fail because Telegram is down.
 */

const TELEGRAM_API = "https://api.telegram.org";

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sarkaarinaukri.online"
  ).replace(/\/$/, "");
}

export function isTelegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

export async function postJobToTelegram(job: {
  title: string;
  slug: string;
  application_end: string;
  vacancy_total?: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set" };
  }

  const url = `${siteBase()}/jobs/${job.slug}`;
  const vacancy =
    job.vacancy_total != null ? `\nVacancy: ${job.vacancy_total} posts` : "";
  const text =
    `*${job.title}*\n` +
    `Last Date: ${formatDate(job.application_end)}` +
    `${vacancy}\n\n` +
    `Details & Apply: ${url}\n` +
    `via SarkaariNaukri.online`;

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Telegram HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** True only when the admin switched the toggle on in site_settings. */
export async function isTelegramAutoPostEnabled(): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "telegram_auto_post")
      .maybeSingle<{ value: unknown }>();
    return data?.value === true;
  } catch {
    return false;
  }
}

export async function setTelegramAutoPost(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();
    const { error } = await supabase.from("site_settings").upsert({
      key: "telegram_auto_post",
      value: enabled,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
