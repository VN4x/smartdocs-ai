import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requestLoginLink, ALLOWED_DOMAIN } from "@/lib/auth.functions";
import { useT } from "@/lib/i18n";
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
  const { t } = useT();
  const sendLink = useServerFn(requestLoginLink);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const domain = `@${ALLOWED_DOMAIN}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/library", replace: true });
    });
  }, [navigate]);

  const domainOk = email.trim().toLowerCase().endsWith(domain);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domainOk) {
      toast.error(t("auth.onlyDomainSignIn", { domain }));
      return;
    }
    setLoading(true);
    try {
      await sendLink({
        data: { email: email.trim(), redirectTo: window.location.origin },
      });
      setLinkSent(true);
      toast.success(t("auth.linkSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.sendErr"));
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
            <CardTitle>{t("auth.teamAccess")}</CardTitle>
            <CardDescription>{t("auth.signInDesc", { domain })}</CardDescription>
          </CardHeader>
          <CardContent>
            {linkSent ? (
              <div className="space-y-3 rounded-md border border-dashed p-4 text-center text-sm">
                <Mail className="mx-auto h-7 w-7 text-primary" />
                <p className="font-medium">{t("auth.checkEmail")}</p>
                <p className="text-muted-foreground">{t("auth.sentTo", { email })}</p>
                <Button variant="ghost" size="sm" onClick={() => setLinkSent(false)}>
                  {t("auth.differentEmail")}
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.workEmail")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`you${domain}`}
                  />
                  {email && !domainOk && (
                    <p className="text-xs text-destructive">{t("auth.onlyDomain", { domain })}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !domainOk}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.sendLink")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
