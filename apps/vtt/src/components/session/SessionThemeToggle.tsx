import { Moon, Sun } from "lucide-react";
import { Button, cn } from "@anvil/ui";
import { useThemeStore } from "../../stores/themeStore.js";

interface SessionThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function SessionThemeToggle({
  className,
  showLabel = true,
}: SessionThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === "light";
  const Icon = isLight ? Sun : Moon;
  const displayLabel = isLight ? "Light" : "Dark";
  const actionLabel = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      type="button"
      aria-label={actionLabel}
      aria-pressed={isLight}
      title={actionLabel}
      onClick={toggleTheme}
      className={cn("shrink-0 text-zinc-400 hover:text-zinc-100", className)}
    >
      <Icon className="size-4" />
      {showLabel && <span>{displayLabel}</span>}
    </Button>
  );
}
