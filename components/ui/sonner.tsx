"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "dark" : "light")
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-emerald-950/90 group-[.toaster]:text-emerald-400 group-[.toaster]:border-emerald-500/20 group-[.toaster]:rounded-2xl group-[.toaster]:shadow-lg group-[.toaster]:shadow-emerald-950/10 group-[.toaster]:border group-[.toaster]:font-mono",
          title: "group-[.toast]:font-bold group-[.toast]:uppercase group-[.toast]:tracking-tighter group-[.toast]:text-emerald-400",
          description: "group-[.toast]:text-zinc-300 group-[.toast]:text-xs group-[.toast]:font-mono",
          actionButton:
            "group-[.toast]:bg-emerald-500 group-[.toast]:text-emerald-950 group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
