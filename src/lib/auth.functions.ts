import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Only addresses on this domain may sign in / be provisioned. */
export const ALLOWED_DOMAIN = "kvaliteetaken.ee";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(255),
  redirectTo: z.string().url().max(2048),
});

/**
 * Public, domain-gated "send me a login link" flow.
 *
 * Public self-signup is disabled in the auth settings, so this is the ONLY way
 * an account is created — and it only creates accounts for the allowed domain.
 * The domain check runs on the server, so it can't be bypassed from the browser.
 */
export const requestLoginLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const domain = data.email.split("@")[1] ?? "";
    if (domain !== ALLOWED_DOMAIN) {
      throw new Error(`Only @${ALLOWED_DOMAIN} email addresses can sign in.`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Provision the account if it doesn't exist yet (idempotent).
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
    });
    if (
      created.error &&
      !/already|registered|exists|been registered/i.test(created.error.message)
    ) {
      throw new Error(created.error.message);
    }

    // Auto-grant the admin role to allowlisted admin addresses (no-op for
    // everyone else). Runs server-side with the service role.
    await supabaseAdmin.rpc("ensure_admin_for_email", { _email: data.email });

    // Email the magic link through the standard auth pipeline.
    const { createClient } = await import("@supabase/supabase-js");
    const pub = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await pub.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: data.redirectTo, shouldCreateUser: false },
    });
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
