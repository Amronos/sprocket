"use client";

import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonIcon, ExitIcon, SunIcon, MoonIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function UserMenu() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-9 w-20 rounded-md bg-gray-100 dark:bg-gray-800" />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AuthenticatedUserMenu />;
}

function AuthenticatedUserMenu() {
  const user = useQuery(api.users.get);
  const { signOut } = useAuth();
  const { setTheme } = useTheme();

  if (!user) {
    return null;
  }

  const handleThemeChange = (newTheme: string) => {
    try {
      setTheme(newTheme);
      console.log('Theme changed to:', newTheme);
    } catch (error) {
      console.error('Failed to change theme:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-3">
          <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center">
            <PersonIcon className="h-3 w-3 text-white" />
          </div>
          <span className="hidden sm:inline-block font-medium">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="flex items-center gap-2"
        >
          <SunIcon className="h-4 w-4" />
          Light mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="flex items-center gap-2"
        >
          <MoonIcon className="h-4 w-4" />
          Dark mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center gap-2"
        >
          <DesktopIcon className="h-4 w-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <ExitIcon className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
