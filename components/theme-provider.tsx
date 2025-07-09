"use client"

import type * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function MatrixThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "matrix-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    const stored = localStorage.getItem(storageKey) as Theme

    if (stored) {
      setTheme(stored)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    root.classList.add(theme)

    // Update CSS custom properties
    if (theme === "light") {
      root.style.setProperty("--matrix-bg", "#ffffff")
      root.style.setProperty("--matrix-dark-bg", "#f8f9fa")
      root.style.setProperty("--matrix-green", "#059669")
      root.style.setProperty("--matrix-dark-green", "#047857")
      root.style.setProperty("--matrix-light-green", "#10b981")
      root.style.setProperty("--matrix-text", "#1f2937")
      root.style.setProperty("--matrix-text-secondary", "#6b7280")
      root.style.setProperty("--matrix-border", "#d1d5db")
      root.style.setProperty("--matrix-card-bg", "#ffffff")
      root.style.setProperty("--matrix-red", "#dc2626")
      root.style.setProperty("--matrix-yellow", "#d97706")
      root.style.setProperty("--matrix-blue", "#2563eb")
      root.style.setProperty("--matrix-cyan", "#0891b2")
    } else {
      root.style.setProperty("--matrix-bg", "#000000")
      root.style.setProperty("--matrix-dark-bg", "#001100")
      root.style.setProperty("--matrix-green", "#00ff00")
      root.style.setProperty("--matrix-dark-green", "#008800")
      root.style.setProperty("--matrix-light-green", "#88ff88")
      root.style.setProperty("--matrix-text", "#00ff00")
      root.style.setProperty("--matrix-text-secondary", "#88ff88")
      root.style.setProperty("--matrix-border", "#008800")
      root.style.setProperty("--matrix-card-bg", "#001100")
      root.style.setProperty("--matrix-red", "#ff0040")
      root.style.setProperty("--matrix-yellow", "#ffff00")
      root.style.setProperty("--matrix-blue", "#0080ff")
      root.style.setProperty("--matrix-cyan", "#00ffff")
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    toggleTheme: () => {
      const newTheme = theme === "dark" ? "light" : "dark"
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useMatrixTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useMatrixTheme must be used within a MatrixThemeProvider")

  return context
}
