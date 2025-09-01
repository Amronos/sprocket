"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, DesktopIcon } from "@radix-ui/react-icons";

export function ThemeIndicator() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-6 w-6 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800" />
    );
  }

  const currentTheme = resolvedTheme || theme;
  const displayTheme = currentTheme === 'system' ? systemTheme : currentTheme;

  const getThemeIcon = () => {
    switch (displayTheme) {
      case 'light':
        return <SunIcon className="h-4 w-4 text-yellow-600" />;
      case 'dark':
        return <MoonIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <DesktopIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getThemeText = () => {
    switch (displayTheme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 text-xs font-medium">
      {getThemeIcon()}
      <span className="hidden sm:inline-block">{getThemeText()}</span>
    </div>
  );
} 