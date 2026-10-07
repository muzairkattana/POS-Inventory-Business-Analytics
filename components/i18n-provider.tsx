"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

type Messages = Record<string, any>

interface I18nContextValue {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  setLang: (lang: string) => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

// Load messages (only English for now)
import en from "@/locales/en.json"
const ALL_MESSAGES: Record<string, Messages> = { en }

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc: any, part: string) => (acc && acc[part] != null ? acc[part] : undefined), obj)
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>("en")
  const [messages, setMessages] = useState<Messages>(ALL_MESSAGES["en"]) // default

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null
    const initial = saved && ALL_MESSAGES[saved] ? saved : "en"
    setLangState(initial)
    setMessages(ALL_MESSAGES[initial])
  }, [])

  const setLang = (newLang: string) => {
    if (!ALL_MESSAGES[newLang]) return
    setLangState(newLang)
    setMessages(ALL_MESSAGES[newLang])
    if (typeof window !== "undefined") localStorage.setItem("lang", newLang)
  }

  const t = useMemo(
    () =>
      (key: string, vars?: Record<string, string | number>) => {
        const val = getByPath(messages, key)
        if (typeof val === "string") return interpolate(val, vars)
        return key // fallback to key
      },
    [messages]
  )

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
