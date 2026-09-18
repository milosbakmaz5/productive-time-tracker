import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'productive-time-tracker:theme'

function getStoredTheme(): Theme | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'light' || raw === 'dark' ? raw : null
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Tracks the effective theme (stored choice, falling back to the OS setting) and exposes a
 * setter that persists it and sets `data-theme` on `<html>` for index.css's rules to key off. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? systemTheme())

  useEffect(() => {
    if (getStoredTheme()) return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      setThemeState(systemTheme())
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  function setTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.dataset.theme = next
    setThemeState(next)
  }

  return { theme, setTheme }
}
