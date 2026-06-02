import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requestLoginLink, ALLOWED_DOMAIN } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileStack, Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Document Library" },
      { name: "description", content: "Sign in to the team document library." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const sendLink = useServerFn(requestLoginLink);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/library", replace: true });
    });
  }, [navigate]);

  const domainOk = email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domainOk) {
      toast.error(`Only @${ALLOWED_DOMAIN} email addresses can sign in.`);
      return;
    }
    setLoading(true);
    try {
      await sendLink({
        data: { email: email.trim(), redirectTo: window.location.origin },
      });
      setLinkSent(true);
      toast.success("Login link sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <FileStack className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold tracking-tight">Document Library</span>
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Team access</CardTitle>
            <CardDescription>
              Sign in with a one-time login link sent to your{" "}
              <span className="font-medium">@{ALLOWED_DOMAIN}</span> email — no password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkSent ? (
              <div className="space-y-3 rounded-md border border-dashed p-4 text-center text-sm">
                <Mail className="mx-auto h-7 w-7 text-primary" />
                <p className="font-medium">Check your email</p>
                <p className="text-muted-foreground">
                  We sent a login link to <span className="font-medium">{email}</span>.
                  Open it on this device to sign in.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setLinkSent(false)}>
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`you@${ALLOWED_DOMAIN}`}
                  />
                  {email && !domainOk && (
                    <p className="text-xs text-destructive">
                      Only @{ALLOWED_DOMAIN} addresses are allowed.
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !domainOk}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send login link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
