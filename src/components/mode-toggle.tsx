import { Moon, Sun, Coffee } from "lucide-react"
import { useTheme, type Theme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ModeToggle({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const next: Record<Theme, Theme> = {
      light: "dark",
      dark: "cream",
      cream: "light",
    }
    setTheme(next[theme] || "light")
  }

  const label = theme === "dark" ? "Dark Mode" : theme === "cream" ? "Cream Mode" : "Light Mode"

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={cycleTheme}
      title={`Current: ${label} (Click to switch)`}
      className="gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium transition-all"
    >
      {theme === "light" && <Sun className="h-3.5 w-3.5 text-amber-500" />}
      {theme === "dark" && <Moon className="h-3.5 w-3.5 text-indigo-400" />}
      {theme === "cream" && <Coffee className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />}
      <span className="capitalize">{theme}</span>
    </Button>
  )
}
