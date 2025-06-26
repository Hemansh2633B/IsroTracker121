"use client"; // Required by Shadcn UI and often for theme providers

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = "light" | "dark" | "system";

const ThemeToggle: React.FC = () => {
  // Initialize theme state from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      // Fallback to system preference if no theme is stored
      // return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      // For simplicity, default to 'light' if nothing set, system preference can be more complex to manage reactively without a hook.
      return 'light';
    }
    return 'light'; // Default for SSR or non-browser environments
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.remove(isDark ? "light" : "dark");
    root.classList.add(isDark ? "dark" : "light"); // Actually, just add 'dark' or remove it.

    // More precise class management:
    root.classList.remove("light", "dark");
    if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        // Optional: update a visual cue for 'system' if needed, but actual theme applied is light/dark
    } else {
        root.classList.add(theme);
    }


    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    // Simple toggle: light -> dark -> light.
    // A more complex toggle might cycle through light -> dark -> system.
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Determine which icon to show based on the *effective* theme
  // (system preference resolved)
  const effectiveTheme = (typeof window !== 'undefined' && theme === 'system')
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {effectiveTheme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
};

export default ThemeToggle;
