import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useT, LANGS } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("lang.label")}>
          <Globe className="mr-1.5 h-4 w-4" />
          {current.short}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>{t("lang.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGS.map((l) => (
          <DropdownMenuCheckboxItem
            key={l.code}
            checked={l.code === lang}
            onCheckedChange={() => setLang(l.code)}
          >
            <span className="mr-2 inline-block w-9 text-xs font-medium text-muted-foreground">
              {l.short}
            </span>
            {l.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
