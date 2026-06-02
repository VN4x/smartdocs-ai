import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  // Client-only: a magic-link redirect lands here with the auth token in the
  // URL (hash or ?code=). We must let the Supabase client consume it and
  // establish a session BEFORE routing, otherwise the token is lost.
  ssr: false,
  component: IndexLanding,
});

function IndexLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const go = (hasSession: boolean) => {
      if (done) return;
      done = true;
      navigate({ to: hasSession ? "/library" : "/auth", replace: true });
    };

    // Fires once Supabase has detected and exchanged the token in the URL.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go(true);
    });

    // Fallback: if there's no token to process (plain visit) or it's already
    // been handled, decide based on the current session.
    supabase.auth.getSession().then(({ data }) => {
      // Give detectSessionInUrl a brief window to fire onAuthStateChange.
      if (data.session) {
        go(true);
      } else {
        const hasAuthParams =
          typeof window !== "undefined" &&
          (window.location.hash.includes("access_token") ||
            window.location.hash.includes("error") ||
            new URLSearchParams(window.location.search).has("code"));
        if (!hasAuthParams) {
          go(false);
        } else {
          // Token present but not yet exchanged — wait, then re-check.
          setTimeout(async () => {
            const { data: d } = await supabase.auth.getSession();
            go(!!d.session);
          }, 1500);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
