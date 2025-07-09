import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { MatrixThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Matrix TTS Comparison",
  description: "Advanced Text-to-Speech comparison system with Matrix UI",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <MatrixThemeProvider defaultTheme="dark" storageKey="matrix-ui-theme">
          {children}
        </MatrixThemeProvider>
      </body>
    </html>
  )
}
