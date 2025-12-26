import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSubscription } from "./useSubscription";
import { useAuth } from "./useAuth";

export type ThemeMode = "dark" | "light" | "system";
export type ThemeStyle = "default" | "neon" | "vintage" | "dark-elf";

interface ThemeContextType {
  mode: ThemeMode;
  style: ThemeStyle;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  canUseTheme: (style: ThemeStyle) => boolean;
  availableStyles: ThemeStyle[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const PREMIUM_THEMES: ThemeStyle[] = ["neon", "vintage", "dark-elf"];
const FREE_THEMES: ThemeStyle[] = ["default"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading: isAuthLoading } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("go20-theme-mode");
    return (stored as ThemeMode) || "dark";
  });

  const [style, setStyleState] = useState<ThemeStyle>(() => {
    const stored = localStorage.getItem("go20-theme-style");
    return (stored as ThemeStyle) || "default";
  });

  const hasThemeAccess = subscription?.limits.hasThemes ?? false;

  const canUseTheme = (themeStyle: ThemeStyle): boolean => {
    if (FREE_THEMES.includes(themeStyle)) return true;
    return hasThemeAccess;
  };

  const availableStyles: ThemeStyle[] = hasThemeAccess ? [...FREE_THEMES, ...PREMIUM_THEMES] : FREE_THEMES;

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("go20-theme-mode", newMode);
  };

  const setStyle = (newStyle: ThemeStyle) => {
    if (!canUseTheme(newStyle)) return;
    setStyleState(newStyle);
    localStorage.setItem("go20-theme-style", newStyle);
  };

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    // Disable transitions on load / theme change to prevent flashes
    root.classList.add("no-transitions");

    // Remove all theme classes
    root.classList.remove("theme-default", "theme-neon", "theme-vintage", "theme-dark-elf");
    root.classList.remove("light", "dark");

    // Apply mode
    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(mode);
    }

    // IMPORTANT: Don't evaluate premium access before auth/subscription are loaded.
    // Otherwise, premium themes can be wrongly reset to default on page refresh.
    const isLoadingAuth = isAuthLoading;
    const isLoadingSubs = user ? isLoadingSubscription : false;
    const shouldDeferThemeAccessCheck = isLoadingAuth || isLoadingSubs;

    if (shouldDeferThemeAccessCheck) {
      // While loading, apply stored style to prevent visual flicker
      root.classList.add(`theme-${style}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.remove("no-transitions"));
      });
      return;
    }

    // Logged out: keep UI consistent but do NOT overwrite stored preference.
    if (!user) {
      root.classList.add("theme-default");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.remove("no-transitions"));
      });
      return;
    }

    // Logged in + subscription loaded: Apply style (only if user has access)
    const userCanUseTheme = FREE_THEMES.includes(style) || hasThemeAccess;
    if (userCanUseTheme) {
      root.classList.add(`theme-${style}`);
    } else {
      root.classList.add("theme-default");
      // Reset to default if user lost access
      if (style !== "default") {
        setStyleState("default");
        localStorage.setItem("go20-theme-style", "default");
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("no-transitions"));
    });
  }, [mode, style, isAuthLoading, user, hasThemeAccess, isLoadingSubscription]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, style, setMode, setStyle, canUseTheme, availableStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
