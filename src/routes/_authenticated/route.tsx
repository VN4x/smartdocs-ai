import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FoldersSidebar } from "@/components/folders-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n";
import { FileStack, Upload, LogOut, Library } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const { t } = useT();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <FoldersSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Link to="/library" className="flex items-center gap-2 font-semibold tracking-tight">
                  <FileStack className="h-6 w-6 text-primary" />
                  <span className="lowercase">kvaliteetaken</span>
                </Link>
              </div>
              <nav className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/library" activeProps={{ className: "bg-accent" }}>
                    <Library className="mr-1.5 h-4 w-4" /> {t("nav.library")}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/upload" activeProps={{ className: "bg-accent" }}>
                    <Upload className="mr-1.5 h-4 w-4" /> {t("nav.upload")}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="mr-1.5 h-4 w-4" /> {t("nav.signOut")}
                </Button>
                <LanguageSwitcher />
              </nav>

            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

