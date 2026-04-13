"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes@0.4.x injects a <script> tag for FOUC prevention.
// React 19 warns about script tags in components (they're not executed on client).
// This is a known incompatibility — suppress the noisy dev warning.
// See: https://github.com/pacocoursey/next-themes/issues/414
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Encountered a script tag") ||
        args[0].includes("Illegal constructor"))
    ) {
      return
    }
    _origError(...args)
  }
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
