'use client';

import { ExitIcon } from '@radix-ui/react-icons';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { GetUser } from '@/components/GetUser';
import { Button } from '@/components/ui/button';
import { Button as AuthButton } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GetUserReturn } from '@/convex/users';

export function UserMenu() {
  const [mounted, setMounted] = useState<boolean>(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="h-9 w-20 rounded-md bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <div>
      <Authenticated>
        <AuthenticatedUserMenu />
      </Authenticated>
      <Unauthenticated>
        <AuthButtons />
      </Unauthenticated>
      <AuthLoading>
        <AuthButtons />
      </AuthLoading>
    </div>
  );
}

function AuthenticatedUserMenu() {
  const user: GetUserReturn = GetUser();
  const { signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Image
            src={user.pfpUrl}
            alt={user.name.charAt(0)}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full bg-cyan-800 flex items-center justify-center"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
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

function AuthButtons() {
  return (
    <div className="flex gap-2">
      <Link href="/sign-in">
        <AuthButton variant="ghost">Sign In</AuthButton>
      </Link>
      <Link href="/sign-up">
        <AuthButton>Sign Up</AuthButton>
      </Link>
    </div>
  );
}
