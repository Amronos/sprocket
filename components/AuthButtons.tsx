"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { Button } from "./ui/button";

export function AuthButtons() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex gap-2">
      {user ? (
        <Button onClick={() => signOut()}>Sign Out</Button>
      ) : (
        <>
          <Link href="/sign-in">
            <Button variant="secondary">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </>
      )}
    </div>
  );
}