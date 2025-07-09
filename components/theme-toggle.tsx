"use client"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMatrixTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useMatrixTheme()

  return (
    <div className="flex items-center gap-2">
      {/* Simple toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="border-matrix-border bg-matrix-card-bg hover:bg-matrix-dark-bg text-matrix-text"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-matrix-yellow" />
        ) : (
          <Moon className="h-4 w-4 text-matrix-blue" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Theme indicator */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-matrix-text-secondary">
        <div
          className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-matrix-green" : "bg-matrix-dark-green"} animate-pulse`}
        ></div>
        <span className="font-mono uppercase tracking-wider">{theme === "dark" ? "MATRIX MODE" : "DAYLIGHT MODE"}</span>
      </div>
    </div>
  )
}

export function AdvancedThemeToggle() {
  const { theme, setTheme } = useMatrixTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-matrix-border bg-matrix-card-bg hover:bg-matrix-dark-bg text-matrix-text"
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-matrix-card-bg border-matrix-border text-matrix-text">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-matrix-dark-bg">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-matrix-dark-bg">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
