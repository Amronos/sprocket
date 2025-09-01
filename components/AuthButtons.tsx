"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { Button } from "./ui/button";

export function AuthButtons() {
  const { user } = useAuth();

  // Don't show auth buttons if user is signed in (UserMenu handles that)
  if (user) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Link href="/sign-in">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link href="/sign-up">
        <Button>Sign Up</Button>
      </Link>
    </div>
  );
}
